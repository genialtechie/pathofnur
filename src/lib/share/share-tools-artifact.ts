import { Platform, Share } from "react-native";
import * as Sharing from "expo-sharing";
import { releaseCapture } from "react-native-view-shot";

import type { ToolsShareArtifact } from "./tools-share";

export type ToolsShareCapture = () => Promise<string>;
export type ToolsShareCaptureSource = ToolsShareCapture | string;
export type ToolsShareResult = "shared" | "dismissed" | "exported";

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || /cancel/i.test(error.message));
}

function extractMimeType(dataUrl: string): string {
  const [header] = dataUrl.split(",");
  return header?.match(/data:(.*?);base64/)?.[1] ?? "image/png";
}

function extractFileExtension(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  return mimeType.split("/")[1] ?? "png";
}

function extractShareUrl(message: string): string | undefined {
  return message.match(/https?:\/\/\S+/)?.[0];
}

function createFallbackShareData(artifact: ToolsShareArtifact): ShareData {
  const shareUrl = extractShareUrl(artifact.shareMessage);
  const shareText = shareUrl
    ? artifact.shareMessage.replace(shareUrl, "").replace(/\n{3,}/g, "\n\n").trim()
    : artifact.shareMessage;

  return {
    title: "Path of Nur",
    text: shareText,
    ...(shareUrl ? { url: shareUrl } : {}),
  };
}

async function createShareFile(dataUrl: string, fileName: string): Promise<File> {
  const mimeType = extractMimeType(dataUrl);
  const extension = extractFileExtension(mimeType);

  if (typeof File !== "function") {
    throw new Error("File API is unavailable");
  }

  if (typeof fetch === "function") {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], `${fileName}.${extension}`, { type: blob.type || mimeType });
  }

  const [, content = ""] = dataUrl.split(",");
  const binary = atob(content);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], `${fileName}.${extension}`, { type: mimeType });
}

function triggerDownload(dataUrl: string, fileName: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const mimeType = extractMimeType(dataUrl);
  const extension = extractFileExtension(mimeType);
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `${fileName}.${extension}`;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function shareOnWeb(uri: string, artifact: ToolsShareArtifact): Promise<ToolsShareResult> {
  if (typeof navigator === "undefined") {
    triggerDownload(uri, artifact.fileName);
    return "exported";
  }

  const shareData = createFallbackShareData(artifact);

  if (typeof navigator.share === "function" && globalThis.isSecureContext) {
    if (uri.startsWith("data:")) {
      try {
        const file = await createShareFile(uri, artifact.fileName);
        const canShareFile =
          typeof navigator.canShare === "function"
            ? (() => {
                try {
                  return navigator.canShare({ files: [file] });
                } catch {
                  return false;
                }
              })()
            : false;

        if (canShareFile) {
          await navigator.share({ ...shareData, files: [file] });
          return "shared";
        }
      } catch (error) {
        console.warn("Tools web file share unavailable, falling back to text share.", error);
      }
    }

    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      console.warn("Tools web share failed, falling back to image export.", error);
    }
  }

  triggerDownload(uri, artifact.fileName);
  return "exported";
}

export async function shareToolsArtifact(
  artifact: ToolsShareArtifact,
  capture: ToolsShareCaptureSource
): Promise<ToolsShareResult> {
  let captureUri: string | null = null;

  try {
    captureUri = typeof capture === "string" ? capture : await capture();

    if (Platform.OS === "web") {
      return await shareOnWeb(captureUri, artifact);
    }

    const canShareFile = await Sharing.isAvailableAsync();
    if (canShareFile) {
      await Sharing.shareAsync(captureUri, {
        dialogTitle: artifact.previewTitle,
        mimeType: "image/png",
        UTI: "public.png",
      });
      return "shared";
    }

    await Share.share({
      title: "Path of Nur",
      message: artifact.shareMessage,
    });
    return "shared";
  } catch (error) {
    if (isAbortError(error)) {
      return "dismissed";
    }

    throw error;
  } finally {
    if (captureUri && !captureUri.startsWith("data:")) {
      releaseCapture(captureUri);
    }
  }
}
