---
title: PyTorch의 contiguous() 함수 이해하기
date: 2024-10-15 20:33:00 +0800
categories: [AI, Pytorch]
tags: [pytorch, tensor, contiguous, view, reshape, transpose, permute]
use_math: true
---

## 1. 메모리 관점에서의 Contiguous란?

**Contiguous**란 배열의 메모리가 연속적인 방식으로 배치되는 것을 의미한다. 예를 들어, 2차원 배열이 있을 때 **한 행이 끝나면 바로 다음 행의 첫 번째 원소가 메모리 상에 이어지는 방식**을 말한다. 이는 데이터 접근의 효율성을 높여주며, CPU나 GPU가 빠르게 데이터를 처리할 수 있도록 도와준다.

PyTorch에서는 텐서를 조작할 때 **연속적인 메모리 배열(contiguous array)**이 중요한 역할을 한다. 일부 텐서 연산(특히 뷰나 슬라이스 관련 연산)에서는 **메모리의 주소가 바뀌지 않고** 텐서 모양만 바뀔 수 있다. 이 때문에 배열이 비연속적일 때 발생하는 문제를 해결하기 위해 `.contiguous()` 함수가 필요하다. 아래는 메모리를 따로 할당하지 않은 텐서 연산 예시이다.

```python
transpose()
narrow()
view()
expand()
permute()
```


## 2. 왜 Contiguous가 중요한가?

PyTorch의 텐서 조작 함수들 중 일부는 입력 텐서가 **contiguous(연속적인 메모리)**인지 요구한다. 예를 들어, `.view()` 함수는 입력 텐서가 반드시 contiguous한 상태여야 동작한다. 반면, 텐서를 **전치(transpose)**하거나 **차원 재배열(permute)**할 경우, 메모리 배치가 뒤섞이면서 non-contiguous한 텐서가 생성된다. 이때 `.contiguous()`를 호출하면 새로운 contiguous 복사본이 만들어져 올바른 연산을 수행할 수 있다.


## 3. Contiguous 관련 코드 예시

### 코드 실행 예제: `transpose()`와 `.contiguous()` 사용 차이

```python
import torch
import numpy as np

a = torch.tensor(np.arange(12).reshape(3, 4), dtype=torch.float64)
print(a)
"""
tensor([[ 0.,  1.,  2.,  3.],
        [ 4.,  5.,  6.,  7.],
        [ 8.,  9., 10., 11.]], dtype=torch.float64)
"""

# contiguous 상태
for row in a:
  for element in row:
    print(element.data_ptr())

# 주소 뒷자리만 표기 (8byte 간격으로 결과가 잘 나옴을 확인)
"""
880
888
896
904
912
920
928
936
944
952
960
968
"""

# transpose -> 메모리 주소가 섞임 (non-contiguous)
ta = a.T
print(ta)
"""
tensor([[ 0.,  4.,  8.],
        [ 1.,  5.,  9.],
        [ 2.,  6., 10.],
        [ 3.,  7., 11.]], dtype=torch.float64)
"""
print(ta.is_contiguous()) # False


# non-contiguous 상태
for row in ta:
  for element in row:
    print(element.data_ptr())

# 4*8byte 간격으로 저장됨 (row는 8byte)
"""
880
912
944
888
920
952
896
928
960
904
936
968
"""

# Contiguous 호출
cta = ta.contiguous()
for row in cta:
  for element in row:
    print(element.data_ptr())

# 메모리 정렬 확인 (새로운 메모리에 할당 확인)
"""
480
488
496
504
512
520
528
536
544
552
560
568
"""
```

### 출력 결과 (메모리 주소 비교)

1. **`a`의 메모리 주소**는 연속적이다.
2. **전치된 텐서 `ta`**의 메모리 주소는 비연속적이다.
3. **`ta.contiguous()`로 만든 `cta`**는 새롭게 연속적인 메모리를 할당받았다.


## 4. Contiguous 관련 에러 코드 예시

아래와 같은 상황에서 에러가 발생할 수 있다.

```python
ta.view(12)  
# Error: RuntimeError: view() cannot be called on non-contiguous tensor
```

`view()` 함수는 텐서가 반드시 contiguous한 상태여야 동작한다. 그렇지 않을 경우, **`.contiguous()`를 먼저 호출**해야 한다.

```python
cta = ta.contiguous()
cta.view(12)  # 정상 동작
```


## 5. View vs Reshape, Transpose vs Permute: Contiguous 차이점

### 5.1 View vs Reshape

- **`view()`**와 **`reshape()`**는 둘 다 텐서의 모양을 바꿔준다.  
- 하지만, **`view()`**는 데이터를 복사하지 않고 같은 메모리를 다른 모양으로 보는 것이기 때문에, 새로운 모양이 기존 stride와 맞아야만 동작한다.  
  - 대부분의 비연속적인(non-contiguous) 텐서에서는 이 조건이 맞지 않아 `view()`를 호출하면 에러가 발생한다.
  - 따라서 `view()`를 쓰기 전에는 보통 `.contiguous()`로 메모리를 다시 정렬해 준다.

- **`reshape()`**는 입력 텐서가 **contiguous 여부와 상관없이** 동작한다.  
  - 가능하면 `view()`처럼 복사 없이 같은 메모리를 공유하는 텐서를 돌려주고, 불가능하면 **복사본을 만든 후 재배열**한다.
  - 그래서 `reshape()`의 결과가 원본과 메모리를 공유하는지, contiguous한지는 상황에 따라 다르다.

> 정리: `reshape()`는 "가능하면 `view()`, 안 되면 복사"하는 역할을 한다. 에러 없이 안전하게 쓸 수 있지만, 원본과 메모리를 공유한다고 가정하면 안 된다.


### 5.2 Transpose vs Permute

- **`transpose()`**와 **`permute()`**는 텐서의 **차원을 재배치**하는 함수다.
  - `transpose()`는 **두 개의 차원만** 바꾸고, `permute()`는 **여러 차원을 동시에** 재배열할 수 있다.

- **주의:** 이 함수들은 모두 **비연속적인(non-contiguous) 텐서**를 반환한다.  
  - 차원 재배열로 인해 메모리 배치가 바뀌기 때문이다.
  - 따라서 이 함수들을 사용한 후, 필요한 경우 **`.contiguous()`를 호출해 연속적인 메모리 복사본을 생성**하는 것이 좋다.


## 6. 결론: 언제 contiguous()를 사용해야 할까?

- **`transpose()`나 `permute()`**로 생성된 텐서를 사용해야 할 때는 항상 **`.contiguous()`**를 고려하는 것이 좋다.  
- **딥러닝 모델**에서 이런 메모리 최적화가 중요한 경우도 있지만, 대개 성능에 큰 영향을 미치지 않는다.  
- 메모리 추가 사용이나 약간의 시간 지연이 발생할 수 있지만, **안전한 연산을 위해서는 contiguous 상태로 강제 변환**하는 것이 좋다.

---

## 참고자료

- *<https://pytorch.org/docs/stable/tensors.html>*
- *<https://pytorch.org/docs/stable/generated/torch.Tensor.contiguous.html>*
- *<https://stackoverflow.com/questions/48915810/what-does-contiguous-do-in-pytorch>*