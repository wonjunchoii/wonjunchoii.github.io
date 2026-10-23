---
title: Python은 Call by Value/Reference?
date: 2023-12-15 19:20:00 +0900
categories: [Language, Python]
tags: [python, call by value, call by reference, mutable, immutable]
---

## 함수의 인자 전달 방식
프로그래밍 언어에서 함수에 인자를 전달하는 방식은 크게 세가지가 있다.

- Call by value
- Call by address
- Call by reference

### Call by Value
```c++
void callByValue(int value){
    value = 20;
    std::cout << value << std::endl;
    std::cout << &value << std::endl;
}

int main(){
    int num = 1;
    callByValue(num);
    std::cout << num << std::endl;
    std::cout << &num << std::endl;
    return 0;
}
```

결과:

```console
$ 20
$ 0x7ffcfde11b4c
$ 1
$ 0x7ffcfde11b64
```

함수에서 인자를 받을 때, 변수에 담긴 값 자체를 스택에 복사하여 입력 받는다. 함수 내에서 변수가 아무리 조작되어도 메모리상에는 다른 변수이기 때문에 원본 데이터가 변하진 않는다. 위의 예시에서 `num` 을 인자로 받지만 `int value = num` 으로 값이 복사되어 인자로 들어간다.

원본값을 바꾸지 않아 안전하지만, 값이 다시 필요할 때는 리턴을 이용하여 전역 변수로 바꾸어주어야 해서 번거로움이 있다.

### Call by Address
```c++
void callByAddress(int* address){
    *address = 20;
    std::cout << *address << std::endl;
    std::cout << &address << std::endl;
}

int main(){
    int num = 1;
    callByAddress(&num);
    std::cout << num << std::endl;
    std::cout << &num << std::endl;
    return 0;
}
```

```console
$ 20
$ 0x7ffdadcb3088
$ 20
$ 0x7ffdadcb30a4
```

함수의 인자로 값을 넘겨주는 것이 아닌 `&num`, 즉 주소값을 넘겨준다. 함수는 `int* address = &num`의 형태로 주소값을 복사하게 되고, 역참조를 통해 값을 바꾸어주게 되면 기존 `num`의 값이 바뀌게 된다. `address`와 `num`은 서로 다른 주소에 할당이 되고, 지역변수이기 때문에 함수를 벗어나면 사라지게 된다.

### Call by Reference
```c++
void callByReference(int& reference){
    reference = 20;
    std::cout << reference << std::endl;
    std::cout << &reference << std::endl;
}

int main(){
    int num = 1;
    callByReference(num);
    std::cout << num << std::endl;
    std::cout << &num << std::endl;
    return 0;
}
```

```console
$ 20
$ 0x7ffeaa6849b4
$ 20
$ 0x7ffeaa6849b4
```

함수에 인자로 받는 변수는 입력 받는 변수의 주소를 넘겨받게 된다. 정확히 표현하면 num을 입력 받고, 함수는 해당 변수가 할당된 메모리를 공유받게 된다.

### Call by Address/Reference 차이?
두 방법 모두 비슷하다고 볼 수 있다. 큰 관점에서 본다면 Address는 `C language`에서 쓰이고, Reference는 `C++ language`에서 쓰인다.

또한 Reference는 절대 `null`이 될 수 없기 때문에, 함수의 인자로 `null`값을 보장 하려면 call by reference method를 사용하면 된다. OOP의 개념으로 보면 Call by Reference 방법이 조금 더 통용적이고, 깔끔한 코드를 위해 쓰인다고 한다.

## Python은 Call by Reference? Call by Value?
결론부터 말하면 둘다 아니다. Python에서 모든 변수는 객체(Object)로 관리되기 때문이다. 이 덕분에 garbage collection이나, pythonic한 코딩이 가능하다. 

Python에서 Mutable한 객체이면 Call by Reference, Immutable한 객체이면 Call by Value가 사용된다. 파이썬 공식 문서에서는 이를 `Call by Assignment`라고 한다.

### Mutable vs Immutable
<img src="{{page.img_pth}}python_mut_immutable.png">
_https://medium.com/@meghamohan/mutable-and-immutable-side-of-python-c2145cf72747_

위 그림에서 볼 수 있는 것처럼 `list`, `set`, `dict`와 같이 가변적인 객체 자료형을 `Mutable`객체, 반대로 `tuple`, `int`와 같이 불가변적인 객체 자료형을 `Immutable`객체라고 한다.

Python에서 객체가 어떤식으로 작동하는지는 [여기](../python-how-object-works)를 참고!