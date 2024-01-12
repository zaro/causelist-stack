# Specify the base Docker image. You can read more about
# the available images at https://crawlee.dev/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM apify/actor-node:20 as runner-base

RUN apk add curl file openjdk21-jre-headless libreoffice  poppler-utils tesseract-ocr tesseract-ocr-data-eng --no-cache

FROM runner-base AS builder

WORKDIR /crawler-dev

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY package.json yarn.lock ./

# Install all dependencies. Don't audit to speed up the installation.
RUN yarn install --production=false

# Next, copy the source files using the user set
# in the base image.
COPY . ./

# Install all dependencies and build the project.
# Don't audit to speed up the installation.
RUN yarn build

FROM builder as development

#COPY --from=runner-base /usr/local/bin/mc /usr/local/bin/mc


CMD /crawler-dev/run.sh

# Create final image
FROM runner-base

WORKDIR /crawler

# Copy only built JS files from builder image
COPY --from=builder /crawler-dev/dist ./dist

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY package.json yarn.lock ./

# Install NPM packages, skip optional and development dependencies to
# keep the image small. Avoid logging too much and print the dependency
# tree for debugging
RUN yarn install --production=true

# Next, copy the remaining files and directories with the source code.
# Since we do this after NPM install, quick build will be really fast
# for most source file changes.
COPY . ./


# Run the image.
CMD /crawler/run.sh
