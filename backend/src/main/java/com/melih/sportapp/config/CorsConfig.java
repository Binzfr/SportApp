package com.melih.sportapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
      // Pour tester, on ouvre à toutes les origines :
      .allowedOriginPatterns("*")
      .allowedMethods("*")
      .allowedHeaders("*")
      .allowCredentials(true);
  }
}