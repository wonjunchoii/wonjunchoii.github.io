---
title: Python의 변수는 어떻게 관리되는가?
date: 2023-12-13 20:29:00 +0900
categories: [Language, Python]
tags: [python, object model, memory management, mutable, immutable]
img_pth: /assets/img/post/pyob/
---
## Python
다른 언어들은 변수를 선언할 때 타입을 함께 명시해 준다. 하지만 파이썬은 변수 타입과 메모리 할당을 따로 해주지 않아도 된다는 점에서 코딩 입문자가 접하기 쉬운 언어인 것 같다. 하지만 파이썬은 다른 언어와 어떻게 차이가 있길래 변수 선언 방식이 다른걸까?

해당 주제는 Ned Batchelder의 [PyCon 2015 발표](https://youtube.com/watch?v=_AEJHKGk9ns)를 참고하여 작성했다. Ned의 설명이 너무 깔끔해서 내용을 정리하고자 작성한다.

### Names and Values
Python에서는 `name is a reference to a value`라고 한다. 이게 무슨 뜻이냐 하면,

```python
x = 23
```
의 경우 변수 `x`가 `23`을 refer 한다고 한다. 나중에 이 x의 값을 이용하게 되면,

```python
print(x + 2)      #25
```

가 된다. 이를 쉽게 이해하기 위해서 아래와 같이 `이름`을 회색 태그로 나타내고, `화살표`로 값을 가리키는 그림을 그려볼 수 있다.

<img src="{{page.img_pth}}pyob1.svg">

이 과정을 Python에서는 `assignment`라고 한다. Assignment는 하나의 값에 대해서 여러번 다른 이름으로 수행 될 수 있다.

```python
x = 23
y = x
```
<img src="{{page.img_pth}}pyob2.svg">

이 경우, `x`와 `y`는 같은 값을 "refer"하고 있다. `x`와 `y`는 값의 고유 이름이 아니라 같은 값을 가리키고 있는 상태 라고 이해하면 된다. 다른말로, 이 두 이름은 서로 관련되어 있지는 않다. 다른 말로, 한 이름을 다른 값으로 재할당 해주면 다른 이름에 영향을 주지 않는다.

```python
x = 23
y = x
x = 12
```
<img src="{{page.img_pth}}pyob3.svg">

여기서 `y = x`는 "y가 x와 동일하다" 보다 "x와 y가 같은 값을 가리키고 있다"가 더 정확한 표현인것 같다.

Python에서의 값은 자신을 가리키고 있는 화살표, 즉 이름이 없을 때 메모리 해제를 시켜준다. 이를 garbage collection이라고 한다. Reference counting의 수가 0이 될 때, 더이상 쓰이지 않는 값이라고 판단하여 값을 메모리에서 지워주게 되는데, 나중에 자세하게 gc에 대해 다뤄보도록 하겠다.

### Assignment
Python에서 값을 이름에 assign 해줄 때, 값은 복사되지 않고, 새로운 값은 절대로 만들어 지지 않는다. 방금 전 예시를 보면 x와 y, 두 변수가 생성된 것처럼 보이지만, `y = x`를 해주었을 때 값은 하나고, 이름표가 두개 만들어 진 것이다. 일반 정수형 말고 리스트와 같이 복잡한 데이터를 보자.

```python
nums = [1, 2, 3]
```
<img src="{{page.img_pth}}pyob4.svg">

```python
nums = [1, 2, 3]
tri = nums
```
<img src="{{page.img_pth}}pyob5.svg">

전의 예시와 같이 하나의 list데이터가 있고, 두개의 이름표 (nums, tri)가 해당 리스트를 가리키고 있다. Python에는 dict, set, user-defined objects와 같이 가변적인 `mutable`값과, 불가변적인 int, strings, tuples과 같은 `immutable`값이 있다.

Mutable 객체는 값 자체를 in-place로 조작할 수 있는 method가 있다는 것이 특징이고, immutable 객체는 값이 절대로 변하지 않는다는 특징이 있다. 하나 예시를 들어보자.

```python
x = 1
x = x + 1
```
과 같은 코드에서 2라는 값이 새로 만들어지고, x라는 이름표는 2라는 데이터에 재할당 해주게 되는 것이다.

반대로 mutable 객체는 값을 바로 조작 할 수 있는 메소드를 사용 할 수 있다.
```python
nums = [1, 2, 3]
nums.append(4)
```
<img src="{{page.img_pth}}pyob6.svg">

<img src="{{page.img_pth}}pyob7.svg">

이렇게 다른 방식으로 값을 조작하는 것을 ***"rebinding the value VS. mutating the value"*** 라고 한다. 이 사실을 알면 다음과 같이 신기한 조작도 가능하다!

```python
nums = [1, 2, 3]
tri = nums
nums.append(4)

print(tri)      # [1, 2, 3, 4]
```

분명 nums를 조작했지만, nums와 tri는 같은 데이터 (이 경우 list)를 가리키고 있기 때문에 tri의 출력 값도 변하게 되는 것이다! 해당 기능은 버그가 아니기 때문에 python을 사용할 때 생각하면서 사용해야 한다.

### Diversity
Python에서의 list, dictionary와 같은 객체 안에 들어있는 정보도 모두 `reference`다. 따라서 전에 그렸었던 그림을 다음과 같이 해석할 수 있다.

<img src="{{page.img_pth}}pyob8.svg">

이 사실을 알면, 다음과 같은 작업도 모두 `referencing`이라고 볼 수 있다.

```python
# 왼쪽은 reference, 오른쪽은 value
my_obj.attr = 23
my_dict[key] = 24
my_list[index] = 25
my_obj.attr[key][index].attr = "etc, etc"

# X 라는 이름에 assignment
X = ...
for X in ...
[... for X in ...]
(... for X in ...)
{... for X in ...}
class X(...):
def X(...):
def fn(X): ... ; fn(12)
with ... as X:
except ... as X:
import X
from ... import X
import ... as X
from ... import ... as X
```

이러한 원리로 인해 python의 함수는 call by value, call by reference가 아닌 `call by assignment`인 것이다.

```python
def immutableFunction(val):
    val = val + 100

def mutableFunction(li, val):
    li.append(val)

num = 1
nums = [1, 2, 3]

immutableFunction(num)
mutableFunction(nums, 100)

print(f"num: {num}\nnums: {nums}")
# num: 1
# nums: [1, 2, 3, 100]
```
위 코드를 차근차근 보자.
- `immutableFunction`에서의 `val`은 local 변수
- `num`은 `val`에 assign 됨
- `val` 은 `val + 1`인 101로 재할당을 함
- local variable인 `val`변수는 함수가 종료되고 reference(화살표)를 삭제
- gc에 의해 `val`이 가리키고 있던 101의 값은 삭제
- 만약 `return val`을 사용하게 되면 reference가 남아 있기 때문에 101이라는 값을 살릴 수 있음

- `mutableFunction`에서의 `li`도 위와 같이 작동함
- `li`가 reference 하고 있는 리스트를 조작함
- `li`와 함수 밖의 `nums`는 같은 값을 가리키고 있기 때문에 값이 성공적으로 바뀜

mutableFunction이 조금 헷갈릴 수 있으니 그림으로 이해해 보자.

<img src="{{page.img_pth}}pyob9.svg">

local variables 는 점선 프레임 안의 reference로 표현되었다. Assignment 는 절대로 값을 복사하거나 생성하지 않기 때문에, 로컬 변수의 `li`는 `nums`와 같은 값을 가리키고 있게 된다. `li.append`메소드를 사용하게 되면 가리키고 있는 list 값을 mutate하게 된다.

<img src="{{page.img_pth}}pyob10.svg">

함수가 끝나면 local name들은 모두 없어지고, 값들은 reference 가 없기 때문에 사라지게 된다. 하지만, `nums`가 가리키고 있는 데이터는 reference 가 남아있기 때문에 사라지지 않는다. 따라서 다음과 같은 결과를 얻을 수 있다.

<img src="{{page.img_pth}}pyob11.svg">

위와 같은 경우 잘 작동하지만, 이 함수를 아래와 같이 작성하게 되면 원하는 결과값이 나오지 않는다.

```python
def mutableFunction(li, val):
    li = li + [val]

nums = [1, 2, 3]

mutableFunction(nums, 100)
print(nums)         # [1, 2, 3]
```
<img src="{{page.img_pth}}pyob9.svg">

이 전의 예시와 동일하게 할당이 된다. 하지만 그 다음 단계에서 조금 차이가 있다.

<img src="{{page.img_pth}}pyob12.svg">

`li = li + [val]`수식은 새로운 list를 만들게 되고, `li` 변수에 해당 값을 위와 같이 재할당 해주게 된다. 함수가 끝나면 로컬 변수인 `li`와 `val`변수의 reference(이름표)가 사라지고, `nums`변수만 아래와 같이 남게 된다.

<img src="{{page.img_pth}}pyob13.svg">

해당 변수가 함수 밖에서도 필요하다면, 아래와 같이 작성하면 된다.

```python
def mutableFunction(li, val):
    li = li + [val]
    return li

nums = [1, 2, 3]

nums = mutableFunction(nums, 100)
print(nums)     #[1, 2, 3, 100]
```

위와 같이 새로운 값을 만들고, 그 값을 리턴하는 함수이다. 이 방법이 제일 많이 쓰이는 방법이다. 그 이유는 값을 in-place로 조작하지 않고 새로운 값을 만들기 때문에 "Presto-Chango"를 방지 할 수 있다.

사실 사용법에 있어 정답은 없다. Python의 작동방식을 이해하고, 상황에 알맞은 기능을 쓰는것이 바람직하다고 생각한다.

### Dynamic Typing
Python은 dynamic typing을 지원하며, 이 뜻은 이름에는 타입이 없다는 뜻이다. 이름은 모든 타입을 지원하며, 하나의 이름은 int, str, func, module 모두 refer가 가능하다. 당연히 하나의 변수가 코드 내에서 여러가지 타입을 사용한다면 코드의 가독성이 떨어지거나 오류가 날 가능성이 높아지지만, 파이썬은 이런 작업이 가능하다.

Python에서의 `name`은 type이 없고, `value`는 scope가 없다는 것이 중요하다. 함수 안의 변수는 local variable 이라고 하고, 여기서 우리는 해당 변수가 함수에 scoped 되었다고 한다. 이 변수는 함수 밖에서는 사용이 되지 않고, 함수 밖으로 나오면 해당 변수는 삭제되는 것이다. 하지만 파이썬에서는 함수 내의 name이 가리키는 변수가 다른 name에 의해서 참조 되고 있다면, 변수는 삭제되지 않을 것이다. Local 변수 자체가 삭제 되는 것이 아닌, local name이 삭제 되는 것이다.

```python
nums = [1, 2, 3]
del nums
```
여태까지 변수를 삭제하는 개념으로 `del` 명령어를 사용하고 있었지만, `del`은 사실 name을 삭제하는 것이였다! 만약 `del`을 사용하여 값의 reference count가 0이 되는 경우, 변수가 gc에 의해 삭제 될 것이다.

### More Examples
---
#### 덧셈 연산자(+)와 증감 연산자(+=)
```python
nums1 = [1, 2, 3]
nums1 = nums1 + [4]

nums2 = [1, 2, 3]
nums2 += [4]
```

언뜻 보면 두 수식은 같은 역할은 하는 것 처럼 보인다. 하지만 `+`은 `__add__` 메소드를,  `+=`는 `__iadd__`메소드를 호출한다.

`__add__`메소드 (`+`)
- 두 리스트를 이어 붙인 **새로운 리스트**를 만들어 반환한다
- 그래서 `nums1 = nums1 + [4]`는 `nums1`이라는 이름을 새 리스트에 다시 연결(rebinding)한다

`__iadd__`메소드 (`+=`)
- 원래 리스트 자체를 **그 자리에서 수정(mutate)**한다
- 그래서 같은 리스트를 가리키던 다른 이름에서도 변화가 보인다

참고로 리스트의 `+`는 순서에 따라 결과가 달라진다. (`[1] + [2]`와 `[2] + [1]`은 다르다)

간단하게 보면 rebinding VS. mutation의 개념이다.

#### python "is" and "=="
결론부터 말하자면 python의 `is`는 reference가 같은지 검사하고, `==`는 value가 같은지 검사한다.

```python
list1 = [1, 2, 3]
list2 = [1, 2, 3]

# 주소가 다름
print(f"{hex(id(list1))}, {hex(id(list2))}") # 0x7f21b76cd600, 0x7f21b76d1580

print(f"== : {list1 == list2}")     # True
print(f"is : {list1 is list2}")     # False
```

위와 같이 같은 값을 가지고 있더라도 할당되는 주소값이 달라 `==`연산은 `True`를 반환하지만, `is`연산은 `False`를 반환한다. 추가적으로 아래 예시를 보자.

```python
a = 2 + 2
b = 4
print(f"{a == b}")      # True
print(f"{a is b}")      # True

c = 1000 + 1
d = 1001
print(f"{c == d}")      # True
print(f"{c is d}")      # False
```

두 연산 모두 똑같은 정수형 변수를 비교하는 연산이지만, 결과가 다르다. 이게 어떻게 된 일인가? "2 + 2 is 4"이고, "1000 + 1 is not 1001"은 직관적이지 않은 연산처럼 보인다. 하지만 이는 Python이 작은 정수에 대해서 메모리 최적화를 시키는 방식에 있다.

Python에서는 효율성의 이유로 작은 정수(보통 -5 ~ 256)는 캐시되고 재사용이 된다. `2 + 2`연산을 수행하면 Python은 캐시에서 정수 `4`를 나타내는 동일한 객체를 사용하게 된다. 첫번째 경우에서 `a`와 `b`가 메모리에서 동일한 값을 참조하고 `is`연산에서 `True`를 반환하게 되는 것이다.

하지만 `1000 + 1`과 같이 범위를 넘어서는 정수의 경우, 같은 방식으로 캐시하지 않는다. 이 경우 값은 같지만 두개의 서로 다른 정수 객체가 메모리에 생성되어 식의 각 변에 있는 덧셈의 결과를 나타내고 각 이름이 각각의 데이터를 가리킨다. 따라서 두개의 이름이 메모리의 서로 다른 값을 참조하기 때문에 ID 검사에서 `False`를 반환하게 되는 것이다.

```python
print(hex(id(a)))      # '0x102baa990'
print(hex(id(b)))      # '0x102baa990'

print(hex(id(c)))      # '0x102d8c570'
print(hex(id(d)))      # '0x102d8c590'
```

#### List 조작
List 객체를 생성하고 초기화 할 때 다음과 같이 진행 할 수 있다.

```python
# case 1
list1 = [[0]] * 8
# >>> [[0], [0], [0], [0], [0], [0], [0], [0]]

# case 2
list2 = [[0] for _ in range(8)]
# >>> [[0], [0], [0], [0], [0], [0], [0], [0]]
```

두 방법 모두 같은 결과를 가져온다. 그럼 무슨 차이가 있을까?

첫번째 경우는 모든 원소들이 같은 값을 참조하게 된다. 전에 말했듯이 Python에서의 list는 referential structure이기 때문이다. 그림으로 표현하면 다음과 같다.

<img src="{{page.img_pth}}Dvei1.png">

이 경우, 다음과 같은 현상이 나타난다.

```python
list1[1].append(3)
# >>> [[0, 3], [0, 3], [0, 3], [0, 3], [0, 3], [0, 3], [0, 3], [0, 3]]
```

두번째 원소(`list1[1]`)의 값만 mutate 해주었지만, 모든 원소가 같은 값을 가리키고 있기 때문에 모든 원소의 값이 변하게 된다. 따라서, 의도한 것이 아니라면 case 2와 같은 방법으로 생성해 주어야 한다.


정리하자면 Python의 특징은 다음과 같다.

1. Assignment never copies data.
2. Python is neither "Call By value" nor "Call By Reference", it's "Call by Assignment" 
3. There is no way in python where a name can refer to another name. A name can only refer to values.

Python은 간편하면서도 신기한 언어인 것 같다.