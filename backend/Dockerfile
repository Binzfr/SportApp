# Dockerfile for Spring Boot backend

# 1. Use a lightweight OpenJDK 21 image
FROM eclipse-temurin:21-jdk-jammy

# 2. Argument for JAR file location
ARG JAR_FILE=target/*.jar

# 3. Copy the built JAR into the container
COPY ${JAR_FILE} app.jar

# 4. Expose the port Spring Boot runs on
EXPOSE 8080

# 5. Run the JAR
ENTRYPOINT ["java", "-jar", "/app.jar"]
