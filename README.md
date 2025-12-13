# Mirae - Group-Study Support App 

**함께 성장하는 즐거움 | 그룹 스터디를 위한 올인원 소셜 플랫폼**

##  프로젝트 소개

<div align="center">
  <img src="./assets/images/mirae-banner.png" width="100%" />
</div>

**Mirae(미래)** 는 혼자 하는 공부의 외로움을 해결하고, 함께 성장하는 환경을 제공하는 스터디 플랫폼입니다.

사용자는 관심사가 같은 사람들과 그룹을 형성하고, 실시간으로 소통하며, 서로의 공부를 인증하고 랭킹 시스템을 통해 동기를 부여받을 수 있습니다.

## 주요 기능

### 1. 그룹 탐색 및 스마트 매칭
사용자는 카테고리별로 스터디 그룹을 검색하고, 인기 그룹 및 이달의 추천 그룹을 통해 자신의 흥미가 가는 스터디 그룹에 참여가 가능합니다.

* **주요 특징:**
    * **정확한 탐색:** 카테고리 및 키워드 기반 그룹 검색
    * **그룹 추천:** 높은 인기 그룹 및 추천 그룹 노출
    * **간편 가입:** 스터디 지원서 작성을 통한 간편한 가입 신청 프로세스

### 2. 실시간 소통 및 피드백
그룹 멤버들과 실시간으로 대화를 나누고 정보를 공유하며, 학습에 대한 피드백을 즉각적으로 주고받을 수 있습니다.

* **주요 특징:**
    * **그룹 채팅:** Firebase Firestore 기반의 실시간 메시징
    * **개인 채팅:** Firebase Firestore 기반의 실시간 메시징
    * **멤버 관리:** 채팅방 내에서 방장의 멤버 승인/관리 및 강퇴 기능
    * **알림 시스템:** 새로운 메시지 및 활동 알림 제공

### 3. 스터디 인증 및 랭킹 시스템
단순한 채팅을 넘어, 실제 학습 시간을 기록하고 인증하며 랭킹을 통해 성취감을 느낄 수 있도록 설계되었습니다.

* **주요 특징:**
    * **스터디 피드:** 사진과 함께 공부 기록 공유
    * **실시간 랭킹:** 개인 및 그룹별 활동 포인트에 따른 순위 경쟁

### 4. 소셜 네트워크 기능
스터디 그룹을 넘어 개인 간의 연결을 강화하여 지속적인 학습 동기를 부여합니다.

* **주요 특징:**
    * **프로필 관리:** 나만의 아이덴티티 설정 (자기소개)
    * **팔로우/팔로잉:** 관심 있는 유저와 친구 맺기 및 개인 채팅으로 연결
<br>

##  시작하기

### 🛠️ Tech Stack & Requirements

<div align="left">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
</div>

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage 
- **State Management**: React Context API
- **Styling**: StyleSheet (React Native)
- **Icons**: Expo Vector Icons (@expo/vector-icons)
<br>

| Platform | Requirement |
| :--- | :--- |
| **Common** | `Node.js 18+`, `npm` or `yarn` |
| **iOS** | iOS 15.1+ (Simulator or Physical Device) |
| **Android** | Android 7.0+ (API 24+, Nougat) |

### 설치 및 실행

1. **의존성 설치**

   ```bash
   git clone [https://github.com/gomo-p/mirae.git](https://github.com/gomo-p/mirae.git)
   cd mirae
   ```

2. **의존성 설치**

   ```bash
   npm install
   ```

3. **개발 서버 시작**

   ```bash
   npx expo start
   ```

4. **앱 실행**
   - iOS: `i` 키를 눌러 iOS 시뮬레이터에서 실행(Mac)
   - Android: `a` 키를 눌러 Android 에뮬레이터에서 실행(ex. Android Studio)
   - 웹: `w` 키를 눌러 웹 브라우저에서 실행

##  Firebase 설정

이 프로젝트는 Firebase를 사용하여 인증 및 데이터 저장을 처리합니다.

### Firebase 서비스

- **Authentication** - 이메일/비밀번호 인증
- **Firestore** - 그룹 및 사용자 데이터 저장
- **Storage** - 이미지 업로드

### 환경 설정

환경 설정 config/firebase.ts 파일에 본인의 Firebase 프로젝트 키를 설정합니다.
<br>

##  화면 구성

### 1. 가입 화면

- **회원가입** - 이메일/비밀번호로 계정 생성
- **로그인** - 기존 계정으로 로그인

### 2. 탐색 화면 (Explore)

- 이달의 그룹 섹션
- 인기있는 그룹 섹션
- 그룹 검색 기능
- 그룹 생성 버튼
- 그룹 가입 기능

### 3. 개인 채팅 화면 (Chat)

- 채팅 화면
- 실시간 채팅 기능
- 팔로우한 사람들을 조회하여 채팅 초대 기능
- 안 읽은 메세지 표시 기능
- 채팅방 설정 기능(채팅방 이름 변경, 강퇴 등)

### 4. 그룹 화면 (Group)

- 가입한 그룹을 표시
- 그룹의 실시간 채팅 기능
- 스터디 인증(개인/그룹) 기능
- 스터디 피드 기능
- 그룹 채팅방 설정 기능
- 그룹 채팅방 내 팔로우 기능

### 5. 랭킹 화면 (Ranking)

- **랭킹 탭 전환** - 개인 랭킹(Personal)과 그룹 랭킹(Group)을 탭으로 전환하여 조회
- **실시간 순위 리스트** - 데이터 베이스와 실시간 연동하여, 총 학습 포인트 합산에 따른 1위부터 50위까지의 순위 표시.(개인/그룹)

### 6. 설정 화면 (Setting)

- 사용자 프로필 및 정보
- 팔로워/팔로잉
- 자기소개 편집
- 로그아웃 기능
<br>

##  프로젝트 구조

```
Mirae
├── .gitignore                      
├── .prettierrc                     # 코드 스타일 자동 정리(Format) 설정 파일
├── .vscode                                     
├── README.md                       # 프로젝트에 대한 설명
├── app.json                        # Expo 앱의 이름, 버전, 아이콘 등 전체 설정 파일
├── app                             # 앱의 화면과 라우팅을 담당하는 폴더
│   ├── (tabs)                      # 하단 탭 네비게이션에 포함되는 화면들
│   │   ├── _layout.tsx             # 탭 네비게이션의 구조와 아이콘 설정
│   │   ├── chat.tsx                # 채팅 목록 화면
│   │   ├── explore.tsx             # 탐색 탭 화면
│   │   ├── group.tsx               # 내 그룹 목록 탭 화면
│   │   ├── index.tsx               # 앱의 메인(홈) 화면
│   │   ├── profile.tsx             # 내 프로필 탭 화면
│   │   ├── ranking.tsx             # 랭킹 확인 화면
│   │   ├── study-cert.tsx          # 공부 인증 화면
│   │   └── study-feed.tsx          # 공부 피드 화면
│   ├── chat
│   │   └── [id].tsx                # 개별 채팅방 상세 화면
│   ├── rooms
│   │   └── [roomid].tsx            # 스터디룸/방 상세 화면
│   ├── _layout.tsx                 # 앱 전체의 레이아웃
│   ├── create-group.tsx            # 그룹 생성 화면
│   ├── customer-center.tsx         # 고객 센터 화면
│   ├── delete-account.tsx          # 회원 탈퇴 화면
│   ├── followers-list.tsx          # 팔로워 목록 화면
│   ├── following-list.tsx          # 팔로잉 목록 화면
│   ├── group-application.tsx       # 스터디 지원서 작성 화면
│   ├── group-chat.tsx              # 그룹 채팅 화면
│   ├── group-detail.tsx            # 그룹 상세 정보 화면
│   ├── group-list.tsx              # 그룹 목록(검색 & 카테고리)
│   ├── group-settings.tsx          # 그룹 설정 화면
│   ├── join-complete.tsx           # 가입 완료 확인 화면
│   ├── language.tsx                # 언어 설정 화면
│   ├── modal.tsx                   # 공통 모달 화면
│   ├── notifications.tsx           # 알림 목록 화면
│   ├── privacy.tsx                 # 개인정보 처리방침 화면
│   ├── profile-management.tsx      # 프로필 수정 및 관리 화면
│   ├── select-grade.tsx            # 학년/등급 선택 화면
│   ├── sign-in.tsx                 # 로그인 화면
│   ├── sign-up.tsx                 # 회원가입 화면
│   └── user-profile.tsx            # 다른 유저의 프로필 조회 화면
├── assets                          # 앱에서 사용하는 정적 파일 저장소
│   └── images                      # 아이콘, 로고, 스플래시 스크린 등 이미지 파일들
├── components                      # 재사용 가능한 UI 컴포넌트 모음
│   ├── ui                          # 버튼, 입력창 등 기초 UI 요소 (아토믹 컴포넌트)
│   │   ├── Avatar.tsx              # 사용자 프로필 이미지 컴포넌트
│   │   ├── Button.tsx              # 공통 버튼 컴포넌트
│   │   ├── Card.tsx                # 카드 형태의 컨테이너 컴포넌트
│   │   ├── CategoryChip.tsx        # 카테고리 표시용 칩 컴포넌트
│   │   ├── GroupCard.tsx           # 그룹 정보를 보여주는 카드 컴포넌트
│   │   ├── GroupListItem.tsx       # 그룹 목록의 개별 아이템 컴포넌트
│   │   ├── Input.tsx               # 텍스트 입력창 컴포넌트
│   │   ├── MemberListItem.tsx      # 그룹 멤버 표시용 컴포넌트
│   │   ├── SearchBar.tsx           # 검색바 컴포넌트
│   │   ├── StatCounter.tsx         # 통계 수치 표시 컴포넌트
│   │   ├── TextLink.tsx            # 텍스트 링크 컴포넌트
│   │   ├── collapsible.tsx         # 접었다 폈다 할 수 있는 뷰 컴포넌트
│   │   └── icon-symbol.tsx         # 아이콘 표시용 심볼 컴포넌트
│   ├── Comments.tsx                # 댓글 목록 및 작성 컴포넌트
│   ├── NotificationListener.tsx    # 알림 수신을 처리하는 리스너 컴포넌트
│   ├── external-link.tsx           # 외부 링크 연결 컴포넌트
│   ├── hello-wave.tsx              # 환영 애니메이션 (손 흔들기) 컴포넌트
│   ├── parallax-scroll-view.tsx    # 스크롤 시 배경이 움직이는 뷰 컴포넌트
│   ├── themed-text.tsx             # 테마(다크/라이트) 적용된 텍스트
│   └── themed-view.tsx             # 테마(다크/라이트) 적용된 뷰
├── config                          # 외부 서비스 설정 파일
│   └── firebase.ts                 # Firebase 인증 및 DB 초기화 설정
├── constants                       # 앱 전반에서 쓰이는 상수 값
│   ├── design-tokens.ts            # 디자인 시스템 토큰 (여백, 크기 등)
│   └── theme.ts                    # 색상 테마 정의 (Colors)
├── contexts                        # 전역 상태 관리 (React Context API)
│   ├── AuthContext.tsx             # 사용자 로그인 상태 관리
│   └── GroupContext.tsx            # 현재 선택된 그룹 등의 상태 관리
├── eslint.config.js                # 자바스크립트 문법 검사(Linting) 설정
├── hooks                           # 커스텀 React Hooks 모음
│   ├── use-color-scheme.ts         # 다크/라이트 모드 감지 훅
│   ├── use-theme-color.ts          # 테마 색상 가져오는 훅
│   └── useAuth.ts                  # 인증 로직을 쉽게 쓰기 위한 훅
├── package-lock.json               # 정확한 패키지 의존성 버전 잠금 파일
├── package.json                    # 프로젝트 메타데이터 및 의존성 라이브러리 목록
├── scripts                         # 프로젝트 관리용 스크립트
│   └── reset-project.js            # 프로젝트 초기화 스크립트
├── services                        # 백엔드 API 통신 및 비즈니스 로직
│   ├── imageService.ts             # 이미지 업로드/처리 관련 로직
│   └── userService.ts              # 사용자 정보 CRUD 관련 로직
├── tsconfig.json                   # TypeScript 컴파일 설정 파일
├── types                           # TypeScript 타입 정의 폴더
└── utils                           # 공통 유틸리티 함수
    └── alert.ts                    # 알림(Alert) 표시 헬퍼 함수

```

##  개발 현황

### 완료된 기능 

[x] UI 컴포넌트 라이브러리 (재사용 가능한 아토믹 컴포넌트)

[x] Firebase 인증 시스템 (회원가입, 로그인, 로그아웃)

[x] 전역 상태 관리 (AuthContext, GroupContext)

[x] 메인 화면 (그룹 목록, 랭킹)

[x] 프로필 화면 (사용자 정보)

[x] 그룹 생성 기능

[x] 데이터베이스 연동 (Firestore)

[x] 그룹 검색 기능 (카테고리 및 키워드)

[x] 그룹 참여 로직 (참여 시 유저 목록 갱신 및 내 그룹 탭 연동)

[x] 소셜 기능 (팔로우 / 팔로워)

[x] 스터디 지원서 (작성 및 조회 기능)

[x] 그룹 관리 (탈퇴 및 설정)

[x] 통계 기능(랭킹)

**Last Updated**: 2025-12-14
