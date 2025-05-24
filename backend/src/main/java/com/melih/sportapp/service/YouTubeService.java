package com.melih.sportapp.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class YouTubeService {

    @Value("${youtube.api.key}")
    private String apiKey;

    public String searchShortVideoUrl(String query) {
        String searchUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q="
                + query + "&key=" + apiKey;
        RestTemplate restTemplate = new RestTemplate();
        String response = restTemplate.getForObject(searchUrl, String.class);
        JSONObject json = new JSONObject(response);
        JSONArray items = json.getJSONArray("items");

        // Récupère les videoIds
        StringBuilder ids = new StringBuilder();
        for (int i = 0; i < items.length(); i++) {
            if (i > 0)
                ids.append(",");
            ids.append(items.getJSONObject(i).getJSONObject("id").getString("videoId"));
        }

        // Appelle videos.list pour avoir la durée
        String detailsUrl = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" + ids + "&key="
                + apiKey;
        String detailsResponse = restTemplate.getForObject(detailsUrl, String.class);
        JSONObject detailsJson = new JSONObject(detailsResponse);
        JSONArray videos = detailsJson.getJSONArray("items");

        for (int i = 0; i < videos.length(); i++) {
            String videoId = videos.getJSONObject(i).getString("id");
            String duration = videos.getJSONObject(i).getJSONObject("contentDetails").getString("duration");
            int seconds = parseDuration(duration);
            if (seconds <= 180) { // 3 minutes
                return "https://www.youtube.com/watch?v=" + videoId;
            }
        }
        return null;
    }

    // Parse ISO 8601 duration (e.g. PT2M30S)
    private int parseDuration(String duration) {
        int minutes = 0, seconds = 0;
        String time = duration.replace("PT", "");
        if (time.contains("M")) {
            String[] parts = time.split("M");
            minutes = Integer.parseInt(parts[0]);
            time = parts.length > 1 ? parts[1] : "";
        }
        if (time.contains("S")) {
            seconds = Integer.parseInt(time.replace("S", ""));
        }
        return minutes * 60 + seconds;
    }
}
