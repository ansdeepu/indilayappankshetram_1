
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    try {
        const videoUrl = new URL(url);
        const hostname = videoUrl.hostname;

        // Only accept valid YouTube hostnames
        if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(hostname)) {
            return null;
        }

        // Handle short URLs like youtu.be/VIDEO_ID
        if (hostname === 'youtu.be') {
            const videoId = videoUrl.pathname.slice(1);
            // Basic validation for 11-character ID
            if (videoId && videoId.length === 11 && !videoId.includes('&')) {
                return videoId;
            }
            return null;
        }

        // Handle standard youtube.com URLs
        if (hostname.includes('youtube.com')) {
            // Handle /watch?v=VIDEO_ID
            if (videoUrl.pathname === '/watch') {
                const videoId = videoUrl.searchParams.get('v');
                if (videoId && videoId.length === 11) {
                    return videoId;
                }
            }

            // Handle /embed/VIDEO_ID or /shorts/VIDEO_ID
            const pathParts = videoUrl.pathname.split('/').filter(Boolean);
            if (['embed', 'shorts'].includes(pathParts[0])) {
                const videoId = pathParts[1];
                if (videoId && videoId.length === 11) {
                    return videoId;
                }
            }
        }
    } catch (e) {
      // The provided string was not a valid URL
      return null;
    }

    // If no valid format is matched after all checks, return null
    return null;
};

// A helper function to get YouTube thumbnail
export const getYoutubeThumbnail = (url: string): string | null => {
    const videoId = getYoutubeVideoId(url);
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    // Return null if no valid videoId could be extracted.
    return null;
};

export const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = getYoutubeVideoId(url);
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return null;
  };
