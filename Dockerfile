FROM node:20-alpine

# create dir for app
RUN mkdir -p /app
RUN mkdir -p /app/api
RUN mkdir -p /app/assets
RUN mkdir -p /app/cli
RUN mkdir -p /app/helpers
RUN mkdir -p /app/models
RUN mkdir -p /app/models/configuration
RUN mkdir -p /app/models/steps
RUN mkdir -p /app/pocos
RUN mkdir -p /app/reports
RUN mkdir -p /app/reports/videos

# Assumes your function is named "app.js", and there is a package.json file in the app directory 
COPY ./package.json ./package-lock.json  ./app/ 
COPY ./api/*.js  ./app/api/ 
COPY ./assets/*.js ./app/assets/
COPY ./cli/*.js ./app/cli/
COPY ./helpers/*.js ./app/helpers/
COPY ./models/*.js ./app/models/
COPY ./models/configuration/*.js ./app/models/configuration/
COPY ./models/steps/*.js ./app/models/steps/
COPY ./pocos/*.js ./app/pocos/

#set working directory
WORKDIR /app

# Install NPM dependencies for function
RUN npm ci

#expose port
EXPOSE 8080

#set ENV on build
ARG AM_VERSION
ENV AM_VERSION=${AM_VERSION}
ENV NODE_ENV=production

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "node", "./api/app.docker.js" ]
