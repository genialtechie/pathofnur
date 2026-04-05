#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

optional_env_arg() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    ENV_ARGS+=("${name}=${!name}")
  fi
}

ensure_resource_group() {
  az group create \
    --name "${AZURE_RESOURCE_GROUP}" \
    --location "${AZURE_LOCATION}" \
    --output none
}

ensure_acr() {
  if ! az acr show \
    --name "${AZURE_ACR_NAME}" \
    --resource-group "${AZURE_RESOURCE_GROUP}" \
    --output none >/dev/null 2>&1; then
    az acr create \
      --name "${AZURE_ACR_NAME}" \
      --resource-group "${AZURE_RESOURCE_GROUP}" \
      --location "${AZURE_LOCATION}" \
      --sku Basic \
      --admin-enabled true \
      --output none
  else
    az acr update \
      --name "${AZURE_ACR_NAME}" \
      --resource-group "${AZURE_RESOURCE_GROUP}" \
      --admin-enabled true \
      --output none
  fi
}

ensure_environment() {
  if ! az resource show \
    --resource-group "${AZURE_RESOURCE_GROUP}" \
    --resource-type "Microsoft.App/managedEnvironments" \
    --name "${AZURE_CONTAINERAPPS_ENV}" \
    --output none >/dev/null 2>&1; then
    az containerapp env create \
      --name "${AZURE_CONTAINERAPPS_ENV}" \
      --resource-group "${AZURE_RESOURCE_GROUP}" \
      --location "${AZURE_LOCATION}" \
      --output none
  fi
}

require_env AZURE_ACR_NAME
require_env SUPABASE_URL
require_env SUPABASE_SERVICE_ROLE_KEY
require_env OPENROUTER_API_KEY
require_env OPENROUTER_MODEL

: "${AZURE_LOCATION:=eastus}"
: "${AZURE_RESOURCE_GROUP:=imaan-api-rg}"
: "${AZURE_CONTAINERAPPS_ENV:=imaan-api-env}"
: "${AZURE_CONTAINERAPP_NAME:=imaan-api}"
: "${AZURE_IMAGE_REPOSITORY:=imaan-api}"
: "${AZURE_CPU:=0.5}"
: "${AZURE_MEMORY:=1.0Gi}"
: "${AZURE_MIN_REPLICAS:=0}"
: "${AZURE_MAX_REPLICAS:=2}"
: "${AZURE_WORKLOAD_PROFILE:=Consumption}"
: "${EMBEDDING_PROVIDER:=openai_compatible}"
: "${EMBEDDING_MODEL:=text-embedding-3-small}"
: "${EMBEDDING_DIMENSIONS:=768}"
: "${PORT:=3001}"
: "${IMAAN_PREFER_PROCESS_ENV:=1}"

if [[ -n "${AZURE_SUBSCRIPTION_ID:-}" ]]; then
  az account set --subscription "${AZURE_SUBSCRIPTION_ID}"
fi

if [[ -z "${AZURE_IMAGE_TAG:-}" ]]; then
  AZURE_IMAGE_TAG="$(git -C "${REPO_ROOT}" rev-parse --short HEAD)"
fi

az extension add --name containerapp --upgrade --allow-preview true --output none
az provider register --namespace Microsoft.App --wait --output none
az provider register --namespace Microsoft.OperationalInsights --wait --output none
az provider register --namespace Microsoft.ContainerRegistry --wait --output none

ensure_resource_group
ensure_acr
ensure_environment

ACR_LOGIN_SERVER="$(
  az acr show \
    --name "${AZURE_ACR_NAME}" \
    --resource-group "${AZURE_RESOURCE_GROUP}" \
    --query loginServer \
    --output tsv
)"
ACR_USERNAME="$(
  az acr credential show \
    --name "${AZURE_ACR_NAME}" \
    --query username \
    --output tsv
)"
ACR_PASSWORD="$(
  az acr credential show \
    --name "${AZURE_ACR_NAME}" \
    --query "passwords[0].value" \
    --output tsv
)"
IMAGE_REF="${ACR_LOGIN_SERVER}/${AZURE_IMAGE_REPOSITORY}:${AZURE_IMAGE_TAG}"

echo "Building and pushing ${IMAGE_REF} with az acr build"
az acr build \
  --registry "${AZURE_ACR_NAME}" \
  --image "${AZURE_IMAGE_REPOSITORY}:${AZURE_IMAGE_TAG}" \
  --file apps/api/Dockerfile \
  "${REPO_ROOT}"

SECRET_ARGS=(
  "supabase-svc-key=${SUPABASE_SERVICE_ROLE_KEY}"
  "openrouter-api-key=${OPENROUTER_API_KEY}"
)

if [[ -n "${EMBEDDING_API_KEY:-}" ]]; then
  SECRET_ARGS+=("embedding-api-key=${EMBEDDING_API_KEY}")
fi

ENV_ARGS=(
  "PORT=${PORT}"
  "IMAAN_PREFER_PROCESS_ENV=${IMAAN_PREFER_PROCESS_ENV}"
  "SUPABASE_URL=${SUPABASE_URL}"
  "SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-svc-key"
  "OPENROUTER_API_KEY=secretref:openrouter-api-key"
  "OPENROUTER_MODEL=${OPENROUTER_MODEL}"
  "EMBEDDING_PROVIDER=${EMBEDDING_PROVIDER}"
  "EMBEDDING_MODEL=${EMBEDDING_MODEL}"
  "EMBEDDING_DIMENSIONS=${EMBEDDING_DIMENSIONS}"
)

if [[ -n "${EMBEDDING_API_KEY:-}" ]]; then
  ENV_ARGS+=("EMBEDDING_API_KEY=secretref:embedding-api-key")
fi

optional_env_arg OPENROUTER_BASE_URL
optional_env_arg ALLOWED_ORIGIN
optional_env_arg EMBEDDING_BASE_URL

if az containerapp show \
  --name "${AZURE_CONTAINERAPP_NAME}" \
  --resource-group "${AZURE_RESOURCE_GROUP}" \
  --output none >/dev/null 2>&1; then
  az containerapp secret set \
    --name "${AZURE_CONTAINERAPP_NAME}" \
    --resource-group "${AZURE_RESOURCE_GROUP}" \
    --secrets "${SECRET_ARGS[@]}" \
    --output none

  az containerapp registry set \
    --name "${AZURE_CONTAINERAPP_NAME}" \
    --resource-group "${AZURE_RESOURCE_GROUP}" \
    --server "${ACR_LOGIN_SERVER}" \
    --username "${ACR_USERNAME}" \
    --password "${ACR_PASSWORD}" \
    --output none

  az containerapp update \
    --name "${AZURE_CONTAINERAPP_NAME}" \
    --resource-group "${AZURE_RESOURCE_GROUP}" \
    --image "${IMAGE_REF}" \
    --cpu "${AZURE_CPU}" \
    --memory "${AZURE_MEMORY}" \
    --min-replicas "${AZURE_MIN_REPLICAS}" \
    --max-replicas "${AZURE_MAX_REPLICAS}" \
    --workload-profile-name "${AZURE_WORKLOAD_PROFILE}" \
    --replace-env-vars "${ENV_ARGS[@]}" \
    --output none
else
  az containerapp create \
    --name "${AZURE_CONTAINERAPP_NAME}" \
    --resource-group "${AZURE_RESOURCE_GROUP}" \
    --environment "${AZURE_CONTAINERAPPS_ENV}" \
    --image "${IMAGE_REF}" \
    --registry-server "${ACR_LOGIN_SERVER}" \
    --registry-username "${ACR_USERNAME}" \
    --registry-password "${ACR_PASSWORD}" \
    --target-port "${PORT}" \
    --ingress external \
    --transport auto \
    --cpu "${AZURE_CPU}" \
    --memory "${AZURE_MEMORY}" \
    --min-replicas "${AZURE_MIN_REPLICAS}" \
    --max-replicas "${AZURE_MAX_REPLICAS}" \
    --workload-profile-name "${AZURE_WORKLOAD_PROFILE}" \
    --secrets "${SECRET_ARGS[@]}" \
    --env-vars "${ENV_ARGS[@]}" \
    --output none
fi

az containerapp ingress enable \
  --name "${AZURE_CONTAINERAPP_NAME}" \
  --resource-group "${AZURE_RESOURCE_GROUP}" \
  --target-port "${PORT}" \
  --transport auto \
  --type external \
  --output none

APP_FQDN="$(
  az containerapp show \
    --name "${AZURE_CONTAINERAPP_NAME}" \
    --resource-group "${AZURE_RESOURCE_GROUP}" \
    --query properties.configuration.ingress.fqdn \
    --output tsv
)"

echo "Deployed image: ${IMAGE_REF}"
echo "Health URL: https://${APP_FQDN}/health"
