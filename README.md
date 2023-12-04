# DoWith-backend
SW사관학교 정글 7기 나만의 무기 만들기 DoWith 프로젝트(백엔드)

프론트엔드: https://github.com/tomoyo519/DoWith_frontend

### 기간
2023-11-07 ~ 2023-12-16 (약 6주)

### 주제
다마고치를 접목한 TODO 리스트

### 기술스택
| 분야 | 기술 |
| --- | --- |
| Front | Flutter + Three.js + Tailwindcss + Axios |
| Back | NestJs + TypeScript + TypeORM + PostgreSQL |
| DB | PostgresSQL |
| Test | Jest |
| DevOps | Docker + Jenkins |

# 임시(뱃지)
[ 기본 틀 ]
https://img.shields.io/badge/{배지이름}-{css컬러}?style={스타일}&logo={로고}&logoColor={로고컬러}<br/>
[ 뱃지 스타일 ]
<br/>
<span><img src ="https://img.shields.io/badge/Java-007396.svg?&style=for-the-badge&logo=Java&logoColor=white"/></span><br/>
<span><img src ="https://img.shields.io/badge/Java-007396.svg?&style=plastic&logo=Java&logoColor=white"/></span><br/>
<span><img src ="https://img.shields.io/badge/Java-007396.svg?&style=flat&logo=Java&logoColor=white"/></span><br/>
<span><img src ="https://img.shields.io/badge/Java-007396.svg?&flat-square&logo=Java&logoColor=white"/></span><br/>
<span><img src ="https://img.shields.io/badge/Java-007396.svg?&style=social&logo=Java&logoColor=white"/></span><br/>

<span><img src ="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white"/></span>

# **[ 🚫 규칙 ]**
### **📌 디렉토리 구조**

       ├ 📦 package
       ⎮    ├ 📁 env   : 개발 / 테스트 / 운영 환경변수
       ⎮    ├ 📁 public: 정적 리소스
       ⎮    ├ 📁 src   : 소스 코드
       ⎮    ⎮    ├ 📁 auth
       ⎮    ⎮    ├ 📁 entities
       ⎮    ⎮    ⎮    ├ 📄 {Entitiy Name}.entity.ts
       ⎮    ⎮    ⎮    ├ 📄 entities.module.ts
       ⎮    ⎮    ├ 📁 enums
       ⎮    ⎮    ⎮    ├ 📄 {Enum Name}.enum.ts
       ⎮    ⎮    ├ 📁 features
       ⎮    ⎮    ⎮    ├ 📁 {API Name}.enum.ts
       ⎮    ⎮    ⎮    ⎮    ├ 📁 dto
       ⎮    ⎮    ⎮    ⎮    ⎮    ├ 📄 {DTO name}.dto.ts
       ⎮    ⎮    ⎮    ⎮    ├ 📄 {API Name}.controller.ts
       ⎮    ⎮    ⎮    ⎮    ├ 📄 {API Name}.service.ts
       ⎮    ⎮    ⎮    ⎮    ├ 📄 {API Name}.module.ts
       ⎮    ⎮    ├ 📁 firebase
       ⎮    ⎮    ├ 📁 gateway
       ⎮    ⎮    ├ 📁 utils
       ⎮    ⎮    ⎮    ├ 📄 exception.filter.ts
       ⎮    ⎮    ⎮    ├ 📄 exception.ts
       ⎮    ⎮    ⎮    ├ 📄 Interceptor.ts
       ⎮    ⎮    ⎮    ├ 📄 middleware.middleware.ts
       ⎮    ⎮    ⎮    ├ 📄 MulterConfigService.ts
       ⎮    ⎮    ⎮    ├ 📄 PagingOptions.ts
       ⎮    ⎮    ├ 📄 app.gateway.ts
       ⎮    ⎮    ├ 📄 app.module.ts
       ⎮    ⎮    ├ 📄 main.ts
       ├ 📝 README.md

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
