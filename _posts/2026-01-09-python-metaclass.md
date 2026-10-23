---
title: Python의 Metaclass 이해하기
date: 2026-01-09 12:00:00 +0900
categories: [Language, Python]
tags: [python, metaclass, type, class, object, object-oriented programming, dynamic typing, python internals]
---

이 글은 Python의 metaclass를 이해하기 위해 반드시 필요한 개념들을 처음부터 끝까지 정리한 문서이다.
목표는 "메타클래스를 외워서 쓰는 것"이 아니라, 왜 이런 구조가 존재하는지를 이해하는 데 있다.

## Python에서 클래스는 객체이다

[이전 글](../python-how-object-works)에서 살펴보았듯이, Python은 모든 것을 객체로 관리한다. 변수, 함수, 모듈 할 것 없이 전부 객체이다. 그렇다면 클래스는 어떨까?

대부분의 언어에서 클래스는 단순히 객체를 생성하기 위한 설계도에 불과하다.
하지만 Python에서는 다르다.

Python에서 클래스는 객체이다.

```python
class ObjectCreator:
    pass
```

위 코드가 실행되는 순간, Python은 메모리에
`ObjectCreator`라는 객체를 하나 생성한다.

```python
obj = ObjectCreator()
```

이때 생성되는 것은 또 다른 객체이다.
즉, 다음 관계가 성립한다.

```text
ObjectCreator → 객체
ObjectCreator() → 또 다른 객체
```

## 클래스가 객체라는 증거

클래스가 객체이기 때문에 가능한 일들은 다음과 같다.

* 변수에 할당할 수 있다
* 함수의 인자로 전달할 수 있다
* 속성을 동적으로 추가할 수 있다
* 다른 이름으로 참조할 수 있다

```python
class Foo:
    pass

def echo(x):
    print(x)

echo(Foo)             # <class '__main__.Foo'>

Foo.new_attr = "hello"
print(Foo.new_attr)   # hello

Bar = Foo
print(Bar())          # <__main__.Foo object at 0x...>
```

이 모든 동작은 클래스가 객체이기 때문에 가능하다.

## 동적으로 클래스 만들기

클래스가 객체라면, 실행 중에 만들어질 수도 있다.

```python
def choose_class(name):
    if name == "foo":
        class Foo:
            pass
        return Foo
    else:
        class Bar:
            pass
        return Bar

MyClass = choose_class("foo")
obj = MyClass()
```

이 함수는 인스턴스가 아니라 클래스 자체를 반환한다.
하지만 여전히 이 방식은 `class` 키워드를 직접 사용하고 있다.

## `type`은 클래스 생성자이다

많은 사람들이 `type()`을 단순히 "타입 확인 함수"로 알고 있다.

```python
type(10)      # <class 'int'>
type("a")     # <class 'str'>
```

하지만 `type`에는 두 번째 역할이 있다.

> `type`은 클래스를 생성하는 함수이다.

```python
MyClass = type(
    "MyClass",
    (),
    {}
)
```

이는 다음과 완전히 동일하다.

```python
class MyClass:
    pass
```

즉, Python에서 클래스 정의는 본질적으로 다음 호출이다.

```python
MyClass = type(name, bases, namespace)
```

## 모든 클래스의 타입은 `type`이다

```python
class Foo:
    pass

print(type(Foo))     # <class 'type'>
print(type(Foo()))   # <class '__main__.Foo'>
```

여기서 중요한 사실이 하나 나온다.

> 클래스의 클래스는 `type`이다.

## `__class__`를 따라가 보기

```python
x = 10
x.__class__            # <class 'int'>
x.__class__.__class__  # <class 'type'>
```

```python
def f(): pass
f.__class__            # <class 'function'>
f.__class__.__class__  # <class 'type'>
```

```python
class A: pass
A.__class__            # <class 'type'>
A.__class__.__class__  # <class 'type'>
```

즉,

```text
모든 객체 → 클래스의 인스턴스
모든 클래스 → type의 인스턴스
type → 자기 자신의 인스턴스
```

`type`은 자기 자신의 메타클래스이다.
이는 CPython 구현 레벨에서만 가능한 특수한 구조이다.

## Metaclass란 무엇인가

이제 정의할 수 있다.

> 메타클래스란 클래스를 생성하는 클래스이다.

```text
객체 = 클래스()
클래스 = 메타클래스()
```

우리가 평소 사용하는 메타클래스는 바로 `type`이다.

## 클래스 생성 시 실제로 일어나는 일

```python
class MyClass:
    x = 1
```

이 코드는 다음과 같이 해석된다.

```python
MyClass = type(
    "MyClass",
    (object,),
    {"x": 1}
)
```

`class` 키워드는 문법일 뿐이며,
실제 클래스 생성은 메타클래스가 담당한다.

## 메타클래스의 전체 흐름 이해하기

메타클래스의 `__new__`, `__init__`, `__call__`이 언제 호출되는지 한 번에 확인해보자.

```python
class MyMetaClass(type):
    def __new__(cls, *args, **kwargs):
        print('metaclass __new__')
        return super().__new__(cls, *args, **kwargs)

    def __init__(cls, *args, **kwargs):
        print('metaclass __init__')
        super().__init__(*args, **kwargs)

    def __call__(cls, *args, **kwargs):
        print('metaclass __call__')
        return super().__call__(*args, **kwargs)

class MyClass(metaclass=MyMetaClass):
    def __init__(self):
        print('child __init__')

    def __call__(self):
        print('child __call__')

print("=============================================")
obj = MyClass()
```

출력은 다음과 같다.

```text
metaclass __new__
metaclass __init__
=============================================
metaclass __call__
child __init__
```

### 왜 이런 순서로 출력되는가?

출력 결과를 두 단계로 나눠서 분석해보자.

**1단계**: 클래스 정의 시점 (class 문이 실행될 때)

```text
metaclass __new__
metaclass __init__
```

`class MyClass(metaclass=MyMetaClass):` 문이 실행되는 순간, Python은 내부적으로 다음을 수행한다.

```python
MyClass = MyMetaClass("MyClass", (), {...})
```

즉, 메타클래스를 호출하여 클래스 객체를 생성한다. 이때:

1. `MyMetaClass.__new__` → 클래스 객체 생성
2. `MyMetaClass.__init__` → 클래스 객체 초기화

**2단계**: 인스턴스 생성 시점 (MyClass() 호출 시)

```text
metaclass __call__
child __init__
```

`obj = MyClass()`가 실행되면:

1. `MyClass`는 객체이다
2. 그 객체의 타입은 `MyMetaClass`이다
3. 객체를 호출하면 그 타입의 `__call__`이 실행된다
4. 따라서 `MyMetaClass.__call__`이 호출된다
5. `super().__call__()`이 내부적으로 `MyClass.__init__`을 호출한다

### 인스턴스의 `__call__`은 언제 실행되는가?

위 예시에서 `child __call__`은 출력되지 않았다. 이유는 간단하다.

```python
obj = MyClass()   # 인스턴스 생성 → metaclass __call__ + child __init__
obj()             # 인스턴스 호출 → child __call__
```

객체 생성과 객체 호출은 완전히 다른 단계이다.

## CPython의 `type.__call__` 분석

`super().__call__()`, 즉 `type.__call__`은 내부적으로 무엇을 하는가?

CPython의 [`Objects/typeobject.c`](https://github.com/python/cpython/blob/main/Objects/typeobject.c)에서 `type_call` 함수를 보면 다음과 같다.

```c
static PyObject *
type_call(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
    PyObject *obj;

    // 1. tp_new 호출 → __new__
    obj = type->tp_new(type, args, kwds);

    // 2. tp_init 호출 → __init__
    if (obj != NULL && type->tp_init != NULL) {
        if (type->tp_init(obj, args, kwds) < 0) {
            Py_DECREF(obj);
            return NULL;
        }
    }
    return obj;
}
```

Python으로 표현하면 다음과 같다.

```python
def type.__call__(cls, *args, **kwargs):
    obj = cls.__new__(cls, *args, **kwargs)
    if isinstance(obj, cls):
        obj.__init__(*args, **kwargs)
    return obj
```

핵심은 다음과 같다.

* `type.__call__`이 `__new__`와 `__init__`을 순차적으로 호출한다
* 메타클래스의 `__call__`을 오버라이드하면 이 과정을 완전히 제어할 수 있다

## 왜 `__new__`는 거의 오버라이드하면 안 되는가?

`__new__`는 객체를 생성하는 역할을 한다. 대부분의 경우 오버라이드할 필요가 없다.

### `__new__`를 오버라이드해야 하는 경우

1. 불변 객체(immutable) 생성 시

```python
class MyInt(int):
    def __new__(cls, value):
        return super().__new__(cls, abs(value))

print(MyInt(-5))  # 5
```

`int`는 불변이므로 `__init__`에서 값을 수정할 수 없다. 생성 시점에 값을 조작해야 한다.

2. 싱글톤 패턴 구현 시 (메타클래스 `__call__`이 더 적합)

3. 객체 생성 자체를 막거나 다른 객체를 반환해야 할 때

### `__new__`를 오버라이드하면 안 되는 이유

* `__new__`는 반드시 인스턴스를 반환해야 한다
* 잘못 구현하면 `__init__`이 호출되지 않을 수 있다
* 대부분의 초기화 로직은 `__init__`에서 처리하면 된다

```python
# 잘못된 예시: __new__가 None을 반환
class Broken:
    def __new__(cls):
        print("creating...")
        # return 문이 없음 → None 반환

obj = Broken()
print(obj)  # None
```

원칙: 객체 생성 제어는 `__new__`, 객체 초기화는 `__init__`에서 처리한다.

## `__call__` 기반 디자인 패턴

메타클래스의 `__call__`을 활용하면 객체 생성 과정을 우아하게 제어할 수 있다.

### 싱글톤 패턴 (Singleton)

```python
class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self):
        print("Database initialized")

db1 = Database()  # Database initialized
db2 = Database()  # (출력 없음 - 기존 인스턴스 반환)
print(db1 is db2)  # True
```

### 객체 풀 패턴 (Object Pool)

```python
class PoolMeta(type):
    _pool = []        # 반납된 객체들
    _created = 0      # 지금까지 만든 객체 수
    _max_size = 3

    def __call__(cls, *args, **kwargs):
        if cls._pool:                      # 반납된 객체가 있으면 재사용
            return cls._pool.pop()
        if cls._created < cls._max_size:   # 아직 여유가 있으면 새로 생성
            cls._created += 1
            return super().__call__(*args, **kwargs)
        raise Exception("Pool exhausted")

    def release(cls, obj):                 # 다 쓴 객체를 풀에 반납
        cls._pool.append(obj)
```

### 팩토리 패턴 (Factory)

```python
class FactoryMeta(type):
    # cls._registry = {"이름": 서브클래스} 형태로 미리 등록되어 있다고 가정
    def __call__(cls, type_name, *args, **kwargs):
        subclass = cls._registry.get(type_name)
        if subclass:
            return super(FactoryMeta, subclass).__call__(*args, **kwargs)
        raise ValueError(f"Unknown type: {type_name}")
```

### 왜 `__call__`이 `__new__`보다 나은가?

| 비교 항목 | `__new__` 오버라이드 | 메타클래스 `__call__` 오버라이드 |
|----------|---------------------|-------------------------------|
| 적용 범위 | 해당 클래스 + 서브클래스 (상속됨) | 해당 클래스 + 모든 서브클래스 |
| 객체 반환 제어 | 가능 | 가능 |
| `__init__` 호출 제어 | 불가능 | 가능 |
| 코드 분리 | 클래스 내부에 혼재 | 메타클래스로 분리 |

메타클래스의 `__call__`은 객체 생성의 전체 과정을 제어할 수 있어 더 강력하다.

## 메타클래스는 언제 쓰는가

메타클래스는 다음과 같은 경우에만 사용된다.

* 클래스 정의 자체를 강제해야 할 때
* ORM, API 스키마, 플러그인 시스템
* 프레임워크 레벨 설계

```python
class Person(models.Model):
    name = models.CharField(max_length=30)
```

이 선언만으로 필드 검증, DB 매핑, 쿼리 생성이 가능한 이유는
`Model`의 메타클래스가 클래스 정의를 가로채기 때문이다.

## 메타클래스를 쓰지 말아야 할 때

다음의 경우 메타클래스는 과하다.

* 단순 기능 추가 → decorator
* 런타임 수정 → monkey patch
* 대부분의 일반 애플리케이션 코드

>"Metaclasses are deeper magic than 99% of users should ever worry about. If you wonder whether you need them, you don't (the people who actually need them know with certainty that they need them, and don't need an explanation about why)."
>— Tim Peters

## 번외: PyTorch nn.Module은 왜 `__call__`을 오버라이드하는가

함수처럼 보이지만 함수가 아니다.

```python
y = model(x)
```

이 코드는 함수 호출처럼 보인다. 하지만 `model`은 함수가 아니라 객체이다.

### 핵심 질문

왜 PyTorch는 이렇게 하지 않았을까?

```python
model.forward(x)
```

왜 굳이 `__call__`을 쓰는가?

### PyTorch의 구조적 요구

PyTorch에서 `nn.Module`은 다음을 동시에 만족해야 한다.

* forward 전후 훅(hook)
* autograd 그래프 연결
* training / eval 모드 분기
* tracing / scripting 대응
* 사용자 정의 로직 보호

이 모든 것을 사용자가 `forward`에 신경 쓰지 않고 쓰게 해야 한다.

### nn.Module.\_\_call\_\_의 실제 역할

단순화하면 다음과 같다.

```python
def __call__(self, *args, **kwargs):
    self._call_pre_hooks()
    result = self.forward(*args, **kwargs)
    self._call_post_hooks()
    return result
```

즉,

* 사용자는 `forward`만 구현
* 프레임워크는 `__call__`에서 전체 파이프라인을 통제

### 왜 메타클래스가 아닌가

PyTorch가 메타클래스를 쓰지 않은 이유는 다음과 같다.

* 인스턴스 단위 제어가 필요
* 동적 그래프
* 런타임 상태 변화
* JIT / tracing 호환성

즉, PyTorch는 **"객체의 호출"**을 제어해야 했지, **"클래스의 생성"**을 제어할 필요는 없었다.

## 세 개를 관통하는 하나의 구조

이제 세 가지가 하나로 연결된다.

```text
type.__call__      → 객체 생성 프로토콜
class decorator    → 클래스 생성 후 수정 (예: @dataclass)
nn.Module.__call__ → 객체 호출 프로토콜
```

| 대상 | 제어 레벨 | 사용 이유 |
|------|----------|----------|
| `type.__call__` | 클래스 호출 | 객체 생성 규칙 |
| class decorator | 클래스 수정 | 편의성 |
| `nn.Module.__call__` | 인스턴스 호출 | 실행 파이프라인 |

## 한 문장으로 요약

Python은 **"생성"**과 **"호출"**을 완전히 분리한 언어이며, metaclass, decorator, `__call__`은 각각 서로 다른 층을 건드리는 도구이다.

## 정리

* Python에서 클래스는 객체이다
* 클래스는 메타클래스에 의해 생성된다
* 기본 메타클래스는 `type`이다
* 클래스 호출은 메타클래스의 `__call__`이다
* 메타클래스는 클래스 정의를 조작하기 위한 도구이다
* 대부분의 경우 사용할 필요는 없다

---

## 참고자료

- *<https://docs.python.org/3/reference/datamodel.html#metaclasses>*
- *<https://stackoverflow.com/questions/100003/what-are-metaclasses-in-python/6581949#6581949>*
- *<https://realpython.com/python-metaclasses/>*
- *<https://github.com/python/cpython/blob/main/Objects/typeobject.c>*