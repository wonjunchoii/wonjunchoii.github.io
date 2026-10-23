---
title: Git 경고 메세지 - LF will be replaced by CRLF
date: 2024-07-31 20:31:00 +0900
categories: [Development, Git]
tags: [git, crlf, line ending]
---

## 경고 메세지
종종 git 명령어를 입력하면, 

```console
warning: LF will be replaced by CRLF in ~
The file will have its original line endings in your working directory
```

라고 경고 문구가 뜬다 LF, CRLF가 뭐길래 해당 경고가 뜰까?

## LF, CR
Typewriter 를 사용할 때에는 한 줄 작성이 끝나면 수동으로 커서의 위치를 바꿔주어야 한다. Line Feed (LF)는 종이를 한칸 위로 올리는 동작이고, Carriage Return (CR)은 커서 위치를 동일 줄에서 맨 앞으로 옮기는 동작이다.

UNIX 계열의 줄바꿈은 `\n`을 사용하여 바꿔줄 수 있지만 Windows나 DOS 줄바꿈은 `\r\n`이 사용되기 때문에 CRLF 이라고 한다. OS 마다 사용되는 줄바꿈 문자열이 다르기 때문에 git 이 경고 메세지를 띄워준 것 이다.

## 해결 방법
- Windows, Dos
```console
$ git config --global core.autocrlf true
```

- Linux, Mac
```console
$ git config --global core.autocrlf input
```

- 해제 
```console
git config --global core.autocrlf false
```

---
참고자료
- *<https://velog.io/@jakeseo_me/LF%EC%99%80-CRLF%EC%9D%98-%EC%B0%A8%EC%9D%B4-Feat.-Prettier>*

- *<https://dabo-dev.tistory.com/13>*