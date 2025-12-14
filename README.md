# BetterLibrusAPI

![npm](https://img.shields.io/npm/v/better-librus-api?color=purple)
![downloads](https://img.shields.io/npm/dt/better-librus-api)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue)

## Description

BetterLibrusAPI is a node package API that scrapes Librus data (like grades, messages, announcements etc.) from specified accounts.\
Librus Syngeria is a Polish school journal system where you can see your grades, write messages to teachers etc.\
Until going to highschool, it was great. You could get fast updates and it sent you notifications on your phone, but when I went to highschool, the app changed and it only allows updates every 3 hours and it doesn't send you messages. If you want to check your recent grade, you have to log in to a website, which is inconvenient.\
That's when I came up with an idea to make an API with a server and an app to make it easier.\
This project is the API part. The server and the app will be done separately, but will be linked here when we start doing it.\
\
-- ROXNES

## Features
- get all data (except item specific e.g. grade info)
- get grades
- get messages
- get announcements
- get grade info
- get message content

### Planned
- get attendance
- get lesson schedule
- get timetable
- get homework
- send messages
- open headless browsers

## Installation
In terminal:
```
npm install better-librus-api
```

**Initializing**
```js
import LibrusAPI from 'librus-api';

const api = await LibrusAPI.create(credentialsArray);
```

### Documentation soon

## Authors

**ROXNES** - Main developer\
**nbb18pl** - Helping & Learning

## Support/Contact

**ROXNES** : roxnes.business@gmail.com\
**nbb18pl** : Roper901@hotmail.com

## License
[AGPL-3.0](https://choosealicense.com/licenses/agpl-3.0/)