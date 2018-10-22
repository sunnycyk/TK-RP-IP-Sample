# TK-RP-IP-Sample

*Note*: to enable issuing features, you will need to submit a feature request on developer.trustedkey.com for issuing

### Instructions for Local Dev

1. Clone repo
2. Edit config.json with credentials from developer.trustedkey.com
3. npm i
4. npm start

### Instructions for Automatted Heroku Deployment

1. [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/trustedkey/TK-RP-IP-Sample/tree/master)
2. Add HOST config var (set it to something like https://appname.herokuapp.com)
3. Add CLIENTID config var (get this from developer.trustedkey.com)
4. Add CLIENTSECRET config var (get this from developer.trustedkey.com)

### One-time Instructions for enabling editing for Heroku App (after using deploy button)
0. heroku login
1. heroku git:clone -a <APP_NAME>
2. git remote add origin ...
3. git pull origin master

Now you can make changes and push using `git push heroku master`

### Customization Guide

1. *Changing scopes*: adjust routes/oauth.js line 10, 11, or 12
2. *Changing claims requested*: adjust config.json "claims" key
3. *Changing claims issued*: adjust routes/oauth.js line 54-59
4. *Changing look and feel*: adjust public/index.html