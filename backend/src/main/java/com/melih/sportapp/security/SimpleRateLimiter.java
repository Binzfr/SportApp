package com.melih.sportapp.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SimpleRateLimiter {
    private final Map<String, List<Long>> registerAttempts = new ConcurrentHashMap<>();
    private final Map<String, List<Long>> loginAttempts = new ConcurrentHashMap<>();
    private final long ONE_HOUR = 60 * 60 * 1000;

    public boolean allowRegister(String ip) {
        return allow(ip, registerAttempts, 5);
    }

    public boolean allowLogin(String ip) {
        return allow(ip, loginAttempts, 10);
    }

    private boolean allow(String ip, Map<String, List<Long>> map, int max) {
        long now = Instant.now().toEpochMilli();
        map.putIfAbsent(ip, new ArrayList<>());
        List<Long> times = map.get(ip);
        times.removeIf(t -> t < now - ONE_HOUR);
        if (times.size() >= max) return false;
        times.add(now);
        return true;
    }
}