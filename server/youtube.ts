import axios from 'axios';
import queryString from 'query-string';
import { log } from './vite';
import { InsertStream, Stream } from '../shared/schema';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Category mapping from our categories to YouTube video category IDs
// Reference: https://developers.google.com/youtube/v3/docs/videoCategories
const CATEGORY_MAPPING: Record<string, string> = {
  'Gaming': 'gaming',
  'Music': 'music',
  'Food': 'food',
  // Add more mappings as needed
};

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId: string;
  viewCount: number;
  publishedAt: string;
}

/**
 * Search YouTube videos by category
 */
export async function searchVideosByCategory(category: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    const searchQuery = CATEGORY_MAPPING[category] || category;
    
    const url = `${YOUTUBE_API_BASE_URL}/search?${queryString.stringify({
      part: 'snippet',
      maxResults,
      q: searchQuery,
      type: 'video',
      key: YOUTUBE_API_KEY,
      videoCategoryId: category === 'Gaming' ? '20' : undefined, // 20 is gaming category ID
      videoDuration: 'long', // To get longer videos
    })}`;

    log(`Fetching YouTube videos for category: ${category}`, 'youtube');
    const response = await axios.get(url);
    
    if (!response.data.items || response.data.items.length === 0) {
      log(`No videos found for category: ${category}`, 'youtube');
      return [];
    }

    // Extract video IDs to get more details
    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    const videosUrl = `${YOUTUBE_API_BASE_URL}/videos?${queryString.stringify({
      part: 'snippet,statistics',
      id: videoIds,
      key: YOUTUBE_API_KEY,
    })}`;

    const videosResponse = await axios.get(videosUrl);
    
    if (!videosResponse.data.items) {
      return [];
    }

    // Map YouTube data to our format
    return videosResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      log(`YouTube API Error: ${error.response?.data?.error?.message || error.message}`, 'youtube');
    } else {
      log(`Error fetching YouTube videos: ${error instanceof Error ? error.message : String(error)}`, 'youtube');
    }
    return [];
  }
}

/**
 * Convert YouTube videos to stream objects
 * @param videos YouTube videos to convert
 * @param category Category name
 * @param startId Starting ID for streams
 * @param userId Optional user ID to assign as creator (defaults to category-based assignment)
 */
export function youtubeVideosToStreams(videos: YouTubeVideo[], category: string, startId: number = 1, userId?: number): Stream[] {
  return videos.map((video, index) => {
    const stream: Stream = {
      id: startId + index,
      // If userId is provided, use it; otherwise assign based on category
      userId: userId || 1, // Default to user 1 if no userId provided
      title: video.title,
      description: video.description.substring(0, 200) + (video.description.length > 200 ? '...' : ''),
      thumbnailUrl: video.thumbnailUrl,
      category,
      tags: [category.toLowerCase(), 'youtube', video.channelTitle.toLowerCase().replace(/\s+/g, '')],
      isLive: true, // All YouTube videos are marked as live
      viewerCount: video.viewCount > 1000 ? Math.floor(video.viewCount / 1000) : Math.floor(Math.random() * 100) + 10,
      startedAt: new Date(video.publishedAt),
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
    };
    return stream;
  });
}