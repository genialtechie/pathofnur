import { Share } from "react-native";
import * as Sharing from "expo-sharing";
import { releaseCapture } from "react-native-view-shot";

import type { ToolsShareArtifact } from "./tools-share";

export type ToolsShareCapture = () => Promise<string>;
export type ToolsShareResult = "shared" | "dismissed" | "exported";

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || /cancel/i.test(error.message));
}

function createShareFile(dataUrl: string, fileName: string): File {
  const [header, content] = dataUrl.split(",");
  const mimeType = header.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(content);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], `${fileName}.png`, { type: mimeType });
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `${fileName}.png`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function shareOnWeb(uri: string, artifact: ToolsShareArtifact): Promise<ToolsShareResult> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    triggerDownload(uri, artifact.fileName);
    return "exported";
  }

  const shareData: ShareData = {
    title: "Path of Nur",
    text: artifact.shareMessage,
  };

  if (uri.startsWith("data:")) {
    const file = createShareFile(uri, artifact.fileName);
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({ ...shareData, files: [file] });
      return "shared";
    }
  }

  await navigator.share(shareData);
  return "shared";
}

export async function shareToolsArtifact(
  artifact: ToolsShareArtifact,
  capture: ToolsShareCapture
): Promise<ToolsShareResult> {
  let captureUri: string | null = null;

  try {
    captureUri = await capture();

    if (process.env.EXPO_OS === "web") {
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
