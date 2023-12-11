# Project  : DoWith-backend
# Team     : IIW - It Works Why
##### Front End: https://github.com/tomoyo519/DoWith_frontend
</br>

## 🗂️ 목차
##### :information_desk_person: [멤버](#information_desk_person-멤버)</br>
##### :calendar: [기간](#calendar-기간)</br>
##### :pushpin: [디렉토리 구조](#pushpin-디렉토리-구조)</br>
##### :mailbox_with_mail: [프로젝트-개요](#mailbox_with_mail-프로젝트-개요)</br>
##### :round_pushpin: [기능](#round_pushpin-기능)</br>
##### :wrench: [기술 스택](#wrench-기술-스택)</br>
##### :couplekiss: [협업](#couplekiss-협업)</br>
##### :chart_with_upwards_trend: [기술적 챌린지](#chart_with_upwards_trend-기술적-챌린지)</br>
##### :octocat: [업무 상세 내용](#octocat-업무-상세-내용)</br>
</br>

## :information_desk_person: ‍멤버
|Github|[<img src="https://avatars.githubusercontent.com/nashs789" width="130px;" style="max-width: 100%;">](https://github.com/nashs789)|[<img src="https://avatars.githubusercontent.com/c4fiber" width="130px;" style="max-width: 100%;">](https://github.com/c4fiber)|[<img src="https://avatars.githubusercontent.com/coding-jjun" width="130px;" style="max-width: 100%;">](https://github.com/coding-jjun)|[<img src="https://avatars.githubusercontent.com/cece-09" width="130px;" style="max-width: 100%;">](https://github.com/cece-09)|[<img src="https://avatars.githubusercontent.com/tomoyo519" width="130px;" style="max-width: 100%;">](https://github.com/tomoyo519)|
|---|:---:|:---:|:---:|:---:|:---:|
|이름|이인복|신병철|박세준|이소정|정다희|
|포지션|<img src="https://img.shields.io/badge/Back End-498EAF?style=for-the-badge&logo=&logoColor=white"/>|<img src="https://img.shields.io/badge/Full Stack-E4DACE?style=for-the-badge&logo=&logoColor=white"/>|<img src="https://img.shields.io/badge/Full Stack-E4DACE?style=for-the-badge&logo=&logoColor=white"/>|<img src="https://img.shields.io/badge/Full Stack-E4DACE?style=for-the-badge&logo=&logoColor=white"/>|<img src="https://img.shields.io/badge/Front End-E5BB4B?style=for-the-badge&logo=&logoColor=white"/>|
|gmail|bbock1214|qudcjf153|psjbrian|sojeong.lee017|vanessa.cheong1|
|블로그|[<img src="https://img.shields.io/badge/tistory-FF6633?style=for-the-badge&logo=tistory&logoColor=white"/>](https://nashs789.tistory.com/)|[<img src="https://img.shields.io/badge/velog-20C997?style=for-the-badge&logo=velog&logoColor=white"/>](https://velog.io/@c4fiber)||[<img src="https://img.shields.io/badge/tistory-FF6633?style=for-the-badge&logo=tistory&logoColor=white"/>](https://cece-blog.tistory.com/)|[<img src="https://img.shields.io/badge/githubpages-222222?style=for-the-badge&logo=githubpages&logoColor=white"/>](https://tomoyo519.github.io/)|
|업무|무엇 했는지|||||
</br>
멘토님도 넣을지??????
</br>

## :calendar: 기간
- 설계 - 2023.11.07 ~ 2023.11.14 (1주)
    - PPT: [바로가기](https://docs.google.com/presentation/d/1aGyAQPrHDuRw4QX_VfzhHuHh4uk_epPGAr8O62015zU/edit#slide=id.p)
- 개발 - 2023.11.14 ~ 2023.12.07 (약 3주)
- 테스트 - 2023.12.07 ~ 2023.12.16 (약 1주)
</br>

## :pushpin: 디렉토리 구조

       ├ 📦 package
       ⎮    ├ 📁 env   : 개발 / 테스트 / 운영 환경변수
       ⎮    ├ 📁 public: 정적 리소스
       ⎮    ├ 📁 src   : 소스 코드
       ⎮    ├ 📁 logs  : 로그 파일(ignore)
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

</br>

## :mailbox_with_mail: 프로젝트 개요
SW사관학교 정글 7기 나만의 무기 만들기 DoWith 프로젝트(백엔드) </br>
여기에 프로젝트를 왜 시작 했는지 설명
</br></br>

## :round_pushpin: 기능
API 정의 해둘 예정 시간 된다면? OR url 링크만 걸어두기
</br></br>

## :wrench: 기술 스택
| 분야 | 기술 |
| --- | --- |
| Front |<img src ="https://img.shields.io/badge/flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white"/> <img src ="https://img.shields.io/badge/three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white"/><img src ="https://img.shields.io/badge/dart-0175C2?style=for-the-badge&logo=dart&logoColor=white"/>|
| Back |<img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white"/><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=tsnode&logoColor=white"/><img src ="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white"/><img src ="https://img.shields.io/badge/typeform-262627?style=for-the-badge&logo=typeform&logoColor=white"/><img src ="https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white"/>|
| DB |<img src ="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>|
| Lib |<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/><img src ="https://img.shields.io/badge/sharp-99CC00?style=for-the-badge&logo=sharp&logoColor=white"/><img src ="https://img.shields.io/badge/socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white"/><img src ="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white"/>|
| DevOps |<img src ="https://img.shields.io/badge/amazonec2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white"/><img src ="https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>|

</br>여기에다가 기술 아키텍쳐 사진 넣을것</br></br>

## :couplekiss: 협업
|바로가기|설명|
|---|:---:|
|<img src ="https://img.shields.io/badge/github-181717?style=for-the-badge&logo=github&logoColor=white"/>|[형상, 이슈 관리 & 코드 리뷰](https://github.com/c4fiber/DoWith_backend)|
|<img src ="https://img.shields.io/badge/jira-0052CC?style=for-the-badge&logo=jira&logoColor=white"/>|[타임라인기반 일정 관리](https://persimmon.atlassian.net/jira/software/projects/IWW/boards/1)|
|<img src ="https://img.shields.io/badge/notion-000000?style=for-the-badge&logo=notion&logoColor=white"/>|[스크럼, API Docs, 메타데이터, 피드백, 회의록 등](https://www.notion.so/7abb2ce040af491aad3f6e877268be5b?pvs=4)|
|<img src ="https://img.shields.io/badge/figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white"/>|[화면 설계](https://www.figma.com/file/TbIxjCTQzHCiIh9fgxObid/Do-With?type=design&node-id=0-1&mode=design&t=QNC0NqmfmA7WXusp-0)|
|<img src ="https://img.shields.io/badge/dbdiagram-004088?style=for-the-badge&logo=diagramsdotnet&logoColor=white"/>|[DB ERD](https://dbdiagram.io/d/last-657595bc56d8064ca0ba8143)|
|<img src ="https://img.shields.io/badge/dropbox-0061FF?style=for-the-badge&logo=dropbox&logoColor=white"/>|파일 공유|
|<img src ="https://img.shields.io/badge/slack-4A154B?style=for-the-badge&logo=slack&logoColor=white"/>|의사소통|
</br>

## :chart_with_upwards_trend: 기술적 챌린지
1. 이거
2. 저거

## :octocat: 업무 상세 내용
- 인복
- 병철
- 세준
- 소정
- 다희
