---
title: 그래프에서의 Permutation Invariance와 Equivariance
date: 2025-07-10 11:20:00 +0900
categories: [AI, Graph]
tags: [pytorch, graph, matrix operations, deep learning]
use_math: true
---

## Permutation Invariance와 Equivariance

그래프는 adjacency matrix(인접 행렬)로 표현할 수 있다. 하지만 이 인접 행렬은 노드의 순서(ordering) 에 따라 모양이 달라질 수 있다. 동일한 그래프라도 노드의 순서만 바뀌면 완전히 다른 행렬처럼 보인다.

따라서, **Permutation invariance**와 **permutation equivariance**는 이런 노드 순서 변화에 따라 함수의 출력이 어떻게 달라지는지를 설명하는 중요한 개념이다. 특히 **Graph Neural Network(GNN)**에서는 이 두 특성이 올바른 학습과 예측을 위해 핵심적으로 요구된다.

## 예제

다음은 노드 3개로 이루어진 간단한 그래프이다.

  <div style="margin-right: 20px; text-align: center;">
        <img src="{{page.img_pth}}small_graph_example.webp" width="250">
    <p style="font-size: 14px;">Graph Example</p>
  </div>

이를 adjacency matrix로 나타내면 다음과 같다.

### 원래 노드 순서: [0, 1, 2]



\\[
    A = \begin{bmatrix}
    0 & 1 & 1 \cr
    1 & 0 & 0 \cr
    1 & 0 & 0
    \end{bmatrix}
\\]




## Permutation이란?

노드의 순서를 바꾸는 것을 permutation이라고 한다. 예를 들어, 노드 순서를 [2, 0, 1]로 바꾸면 다음과 같다.

이를 표현하는 permutation matrix \\( P \\)는 다음과 같다.

\\[
    P = \begin{bmatrix}
    0 & 0 & 1 \cr
    1 & 0 & 0 \cr
    0 & 1 & 0
    \end{bmatrix}
\\]


### Permuted Adjacency Matrix 계산

순서를 바꾼 adjacency matrix는 다음과 같이 계산된다.

\\[
A' = P A P^\top = \begin{bmatrix}
0 & 1 & 0 \cr
1 & 0 & 1 \cr
0 & 1 & 0
\end{bmatrix}
\\]

이 행렬은 노드 순서만 바뀌었을 뿐, 원래 그래프와 구조적으로 동일하다.


## Permutation Invariance

**Permutation invariance**란, 노드 순서를 어떻게 바꾸든 함수 출력이 변하지 않는 것을 의미한다.

### 수식

\\[
    f(P A P^\top) = f(A)
\\]

### 예시: 전체 degree 합

모든 노드의 degree를 더한 값은 순서에 상관없이 항상 같다. 예를 들어,

- 원래 그래프에서 degree 합: 2 + 1 + 1 = 4
- permuted 그래프에서도 degree 합: 1 + 2 + 1 = 4

즉, degree 합을 계산하는 함수는 permutation invariant하다.


## Permutation Equivariance

**Permutation equivariance**란, 노드 순서를 바꾸면 출력의 순서도 그에 맞게 바뀌는 것을 의미한다.

### 수식

\\[
    f(P A P^\top) = P f(A)
\\]

### 예시: 각 노드의 degree 계산

- 원래 순서에서의 degree: [2, 1, 1]
- 노드 순서를 [2, 0, 1]로 바꾸면, 순서에 맞게 degree도 [1, 2, 1]

즉, 출력값이 permutation matrix에 맞춰 같은 정보지만 다른 순서로 재배열된 것이다. 이 경우 degree 계산 함수는 permutation equivariant하다.


## GNN에서 왜 중요한가?

### Node-level task (노드 분류 등)
- GNN 레이어는 permutation equivariant해야 한다.
- 그래야 노드 순서만 바뀌더라도, 같은 노드에 대해 같은 결과를 출력할 수 있다.

### Graph-level task (그래프 분류 등)
- GNN 전체 아키텍처는 permutation invariant해야 한다.
- 그래야 노드 순서가 달라도 그래프 전체에 대한 예측이 일관성 있게 유지된다.


## 마무리

- **Permutation invariance**: 노드 순서를 바꿔도 결과는 변하지 않음 (예: 그래프의 총 degree)
- **Permutation equivariance**: 순서가 바뀌면 결과도 같은 방식으로 바뀜 (예: 각 노드의 degree)

GNN을 설계할 때 이 두 특성을 고려하지 않으면, 학습된 모델이 노드 순서에 따라 엉뚱한 예측을 할 수 있다. 따라서 이 개념들은 GNN의 핵심 기초라고 할 수 있다.


## 참고자료

- *<https://www.cs.mcgill.ca/~wlh/grl_book/>*