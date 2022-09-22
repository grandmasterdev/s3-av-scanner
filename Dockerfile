FROM clamav/clamav:latest

RUN apk update
RUN apk add --no-cache openrc
RUN apk add --no-cache curl
RUN apk add --no-cache bash
RUN apk add --no-cache util-linux
RUN apk add nodejs
RUN apk add npm

ENV CLAMAV_NO_CLAMD false

VOLUME clam_db

RUN mkdir /run/lock
RUN chown clamav /run/lock
RUN chgrp clamav /run/lock
RUN chmod 777 /run/lock

WORKDIR /home/clamav-app

COPY ./dist/scanner .

STOPSIGNAL SIGQUIT

CMD whoami && pwd && . /init & clamd restart && node index.js

EXPOSE 3310 7357 80 8080 3000