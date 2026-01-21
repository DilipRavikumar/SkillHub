# Stage 1: Build
FROM maven:3.8-openjdk-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B -T 1

# Copy source code
COPY src ./src

# Build the application with memory optimization
ENV MAVEN_OPTS="-Xmx512m -Xms256m"
RUN mvn clean package -DskipTests -T 1

# Stage 2: Runtime
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
