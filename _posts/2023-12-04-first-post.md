---
title: Github Blog 설치
date: 2023-12-04 23:11:00 +0800
categories: [Blogging, Tutorial]
tags: [github, blog]
---
# Github Blog!
---
여러 블로그를 찾아보며 드디어 github 블로그 설정을 완료했다. 
웹사이트의 기본도 모르는 상태에서 공부 일지를 기록하고 싶어 무작정 따라했다. 깃허브 블로그를 생성하는 과정과 생겼던 오류에 대해서 기록하고자 한다. 해당 과정은 맥 기준으로 진행했다.

## Homebrew 설치하기
macOS 전용 만능(?) 툴이다. 이미 설치가 되어있기 떄문에 스킵.

## Ruby 설치하기
Ruby가 뭔가 하고 찾아보니 python 과 유사한 하이레벨 스크립트 언어라고 한다. 자주 쓸지는 모르겠지만 편하게 버전을 관리하기 위해 `pyenv`와 비슷한 `rbenv`와 ruby 를 설치하기 위해 `ruby-build`를 설치해주자.

```console
$ brew install rbenv ruby-build
```

설치가 완료 되었다면 설치 가능한 ruby 버전을 확인한다. `pyenv`와 기능이 비슷해서 사용해본 사람들은 익숙하게 느껴질 것 같다.

```console
$ rbenv install -l
```

버전이 많았지만 나는 사람들이 쓰는 `Ruby 3.1.3` 버전을 설치하였다

```console
$ rbenv install 3.1.3
$ rbenv versions
```

설치된 버전을 글로벌 버전으로 변경한다

```console
$ rbenv global 3.1.3
$ rbenv hash
```

## Bundler 설치하기
Bundler가 또 뭐냐... 찾아보니 Ruby 프로젝트에 필요한 gem(Ruby 라이브러리)들과 그 버전을 `Gemfile`에 적어두고 한 번에 설치, 관리해주는 도구라고 한다. Python의 `pip`와 `requirements.txt` 같은 역할이다. Jekyll도 gem으로 설치하기 때문에 필요하다. 한번 설치를 해보자.

```console
$ gem install bundler
ERROR:  While executing gem ... (Gem::FilePermissionError)
    You don't have write permissions for the ...
```

마주하고 싶지 않았던 오류가 나를 반긴다. 피할수 없으면 맞서 싸워야 한다. 당황하지 않고 에러 메세지를 읽어보면 Ruby권한이 없다는거 같다. `rbenv`의 PATH를 시스템에 추가해보자.

```console
$ vim ~/.zshrc
```

`~/.zshrc`파일을 열어 아래 두줄을 추가하여 PATH를 설정해주자.

```console
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"
```

변경사항을 `source ~/.zshrc` 명령어를 통해 적용시켜주고 다시 설치를 해보자.

```console
$ gem install bundler
...
gem installed
```

설치 성공!

## Jekyll 설치하기
사이트의 구조는 잘 모르지만, 서버와 소통하며 페이지를 만드는 것을 동적 사이트, 반대로 이미 가지고 있는 파일들로 사이트를 만드는 것을 정적 사이트 라고 하는것 같다. 깃허브 블로그는 이미 만들어진 마크다운 파일들로 페이지를 생성하고, 깃허브에 업로드 하여 정적 사이트를 만드는 것 이라고 한다. 나 같은 사람도 정적 웹사이트를 쉽게 만들어주는 사이트 생성기인 `jekyll`을 빠르게 설치해주자.

여담으로, 지킬 앤 하이드에서 '지킬'이라고 한다.

```console
$ gem install jekyll
```

이제 필요한 모든 것이 설치된거 같으니 설치가 잘 되었는지 버전을 확인해보자.
```console
$ jekyll -v
jekyll 4.3.2

$ bundler -v
Bundler version 2.4.22
```

설치 완료!

중요한 건, bundle 실행 전 ruby 버전이 3 이상인지 체크해야 한다. 그 이하의 버전에서 bundle을 통해 모듈을 설치 할 경우 테마에서 사용하는 모듈과 호환되지 않는 경우가 있어서 검색, 다크모드와 같은 기능이 비정상적으로 동작 할 수 있다.

## node.js 모듈 설치
처음 설치 할 때 이 부분을 놓쳐 몇시간동안 헤맨적이 있다. node.js 모듈을 설치하지 않으면 `assets/js/dist/*.min.js Not Found`에러가 뜨기 때문에 설치 해주자.

```console
npm install && npm run build
```

설치 후 로컬에서 빌드 해보자.
```console
bundle exec jekyll serve
```

로컬에서 `http://127.0.0.1:4000/`주소로 정상적으로 표시가 된다면 세팅 완료!