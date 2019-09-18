FROM openjdk:12-alpine

ENV GRADLE_VERSION 5.6.2

# get gradle and supporting libs
RUN apk -U add --no-cache curl; \
    curl https://downloads.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip > gradle.zip; \
    unzip gradle.zip; \
    rm gradle.zip; \
    apk del curl; \
    apk update && apk add --no-cache libstdc++ && rm -rf /var/cache/apk/*

ENV PATH=${PATH}:/gradle-${GRADLE_VERSION}/bin

COPY src /usr/src/games/src
COPY build.gradle /usr/src/games
COPY settings.gradle /usr/src/games

WORKDIR /usr/src/games
RUN gradle build

ENTRYPOINT ["gradle","bootRun"]

EXPOSE 8080
