# GOMO - Group Management App 

React Native (Expo) 기반의 그룹 관리 모바일 애플리케이션입니다.

##  프로젝트 소개

GOMO는 사용자들이 다양한 주제의 그룹을 만들고, 검색하고, 참여할 수 있는 소셜 그룹 관리 플랫폼입니다.

### 주요 기능

- �**사용자 인증** - Firebase를 이용한 회원가입/로그인/로그아웃
-  **그룹 탐색** - 이달의 그룹, 인기있는 그룹 목록 조회
-  **프로필 관리** - 사용자 프로필, 팔로워/팔로잉, 자기소개 편집
-  **그룹 검색** - 카테고리별 그룹 검색 
-  **그룹 생성** - 새로운 그룹 만들기
-  **채팅** - 그룹 내 실시간 채팅
-  **랭킹** - 개인 및 그룹 별 포인트 합산하여 순위 측정

##  시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Expo CLI
- iOS Simulator (Mac) 또는 Android Emulator

### 설치 및 실행

1. **의존성 설치**

   ```bash
   npm install
   ```

2. **개발 서버 시작**

   ```bash
   npx expo start
   ```

3. **앱 실행**
   - iOS: `i` 키를 눌러 iOS 시뮬레이터에서 실행
   - Android: `a` 키를 눌러 Android 에뮬레이터에서 실행
   - 웹: `w` 키를 눌러 웹 브라우저에서 실행

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
│   ├── create-group.tsx            # 새 그룹 만들기 화면
│   ├── customer-center.tsx         # 고객 센터 화면
│   ├── delete-account.tsx          # 회원 탈퇴 화면
│   ├── followers-list.tsx          # 팔로워 목록 화면
│   ├── following-list.tsx          # 팔로잉 목록 화면
│   ├── group-application.tsx       # 그룹 지원서 관리 화면
│   ├── group-chat.tsx              # 그룹 채팅 화면
│   ├── group-detail.tsx            # 그룹 상세 정보 화면
│   ├── group-list.tsx              # 그룹 리스트 화면
│   ├── group-settings.tsx          # 그룹 설정 변경 화면
│   ├── join-complete.tsx           # 가입 완료 안내 화면
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
│   │   ├── MemberListItem.tsx      # 멤버 목록의 개별 아이템 컴포넌트
│   │   ├── SearchBar.tsx           # 검색바 컴포넌트
│   │   ├── StatCounter.tsx         # 통계 수치 표시 컴포넌트
│   │   ├── TextLink.tsx            # 텍스트 링크 컴포넌트
│   │   ├── collapsible.tsx         # 접었다 폈다 할 수 있는 뷰 컴포넌트
│   │   └── icon-symbol.tsx         # 아이콘 표시용 심볼 컴포넌트
│   ├── Comments.tsx                # 댓글 목록 및 작성 컴포넌트
│   ├── NotificationListener.tsx    # 알림 수신을 처리하는 리스너 컴포넌트
│   ├── external-link.tsx           # 외부 링크 연결 컴포넌트
│   ├── haptic-tab.tsx              # 햅틱 반응이 있는 탭 컴포넌트
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
│   └── memo.ts                     # 메모 관련 타입 정의
└── utils                           # 공통 유틸리티 함수
    └── alert.ts                    # 알림(Alert) 표시 헬퍼 함수

```

##  디자인 시스템

프로젝트는 일관된 디자인을 위해 중앙 집중식 디자인 토큰 시스템을 사용합니다.

### 주요 디자인 토큰

- **Colors** - Primary, Success, Warning, Error, Background, Text
- **Typography** - Font sizes, weights, line heights
- **Spacing** - 일관된 여백 시스템 (xs, sm, md, lg, xl, 2xl, 3xl)
- **Border Radius** - 모서리 둥글기 (sm, md, lg, xl, full)
- **Shadows** - 그림자 효과 (sm, md, lg, xl)

### 다크 모드 지원

모든 화면과 컴포넌트는 라이트/다크 모드를 자동으로 지원합니다.

##  Firebase 설정

이 프로젝트는 Firebase를 사용하여 인증 및 데이터 저장을 처리합니다.

### Firebase 서비스

- **Authentication** - 이메일/비밀번호 인증
- **Firestore** - 그룹 및 사용자 데이터 저장
- **Storage** - 이미지 업로드

### 환경 설정

Firebase 설정은 `config/firebase.ts`에 있습니다. 본인의 Firebase 프로젝트를 사용하려면 해당 파일의 설정을 업데이트하세요.

##  화면 구성

### 1. 인증 화면

- **회원가입** (`/sign-up`) - 이메일/비밀번호로 계정 생성
- **로그인** (`/sign-in`) - 기존 계정으로 로그인

### 2. 메인 화면 (Explore)

- 이달의 그룹 섹션
- 인기있는 그룹 섹션
- 그룹 검색 기능
- 그룹 생성 버튼

### 3. 프로필 화면

- 사용자 아바타 및 정보
- 팔로워/팔로잉 통계
- 자기소개 편집
- 로그아웃 기능

### 4. 기타 화면

- **Chat** - 채팅 화면
- **Friends** - 친구 목록

##  기술 스택

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage 
- **State Management**: React Context API
- **Styling**: StyleSheet (React Native)
- **Icons**: Expo Vector Icons (@expo/vector-icons)

##  개발 현황

### 완료된 기능 

- [x] 디자인 시스템 구축 (design tokens)
- [x] 재사용 가능한 UI 컴포넌트 라이브러리
- [x] Firebase 인증 시스템 (회원가입, 로그인, 로그아웃)
- [x] 전역 인증 상태 관리 (AuthContext)
- [x] 메인 화면 (그룹 목록)
- [x] 프로필 화면 (사용자 정보, 통계)
- [x] 하단 탭 네비게이션
- [x] 그룹 생성 화면
- [x] Firestore 데이터베이스 연동

### 개발 중 

- [ ] 그룹 검색 화면
- [ ] 실제 그룹 데이터 CRUD
- [ ] 그룹 참여화면에 유저 목록 나오도록
- [ ] 그룹 참여 시 그룹 탭에 참여한 그룹 목록나오도록
- [ ] 팔로우 팔로워 기능
- [ ] 스터디 지원서 어디선가 보이도록
- [ ] 그룹 탈퇴
- [ ] 통계기능 -> 완료


---

**Last Updated**: 2025-12-06
