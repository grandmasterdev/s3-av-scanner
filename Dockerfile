FROM clamav/clamav

USER root

RUN apk update
RUN apk add --no-cache openrc
RUN apk add --no-cache nginx
RUN apk add --no-cache curl
RUN apk add --no-cache bash
RUN apk add nodejs
RUN apk add npm

RUN echo '\
. /etc/profile ; \
' >> /root/.profile

RUN mkdir /run/lock
RUN chown clamav /run/lock
RUN chgrp clamav /run/lock

WORKDIR /home/clamav-app

COPY ./dist .

STOPSIGNAL SIGQUIT

CMD freshclam && clamd && node index.js && nginx -g "daemon off;"

EXPOSE 3310 7357 80 8080 3000