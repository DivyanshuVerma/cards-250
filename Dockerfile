FROM openjdk:12-alpine

WORKDIR /tmp
COPY jar/demo-1.0.jar /tmp/

ENTRYPOINT ["java","-jar","/tmp/demo-1.0.jar"]

EXPOSE 8080
