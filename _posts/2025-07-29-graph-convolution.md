---
title: Graph Convolutional Network
date: 2025-07-29 11:20:00 +0900
categories: [AI, Graph]
tags: [pytorch, mpnn, graph, graph convolution, convolution, matrix operations, deep learning]
use_math: true
---

## Motivation

Graph Convolutional Network(GCN)의 핵심 아이디어는, CNN의 강력한 지역 표현 학습 능력과 파라미터 공유 구조를 그래프라는 일반화된 데이터 구조 위에서도 적용해보자라는 생각에서 파생된 개념이다.

우리가 잘 알고 있는 CNN은 주로 이미지와 같이 고정된 grid 구조를 가진 데이터에 사용되며, 두 가지 특징을 가진다:

1. Locality (지역성): CNN은 인접한 픽셀들을 커널로 묶어서 학습하기 때문에, 이미지 내 지역적인 패턴을 잘 포착할 수 있다.
2. Weight sharing (가중치 공유): 모든 위치에서 동일한 필터를 적용함으로써 학습 파라미터 수를 줄이고 일반화 성능을 향상시킬 수 있다.

이렇기에, 자연스럽게 “그래프 위에서도 이웃 노드들의 로컬 정보를 학습하고, 그 과정에서 가중치를 공유하면 어떨까?” 라는 아이디어로 이어진다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}network_and_grid.png" alt="Networks vs Grid (Images)" width="500">
  <p>Comparison between Network structures and Grid (Image) structures.</p>
</div>

하지만 그래프 구조는 이미지와 다른 구조를 가지고 있기 때문에 여러가지 어려움이 존재한다:

* 이웃 노드의 개수가 일정하지 않다
  $\rightarrow$ CNN은 항상 $k \times k$ 커널을 사용하지만, 그래프에서 각 노드는 N 개의 이웃 수를 가진다.

* 노드 순서에 대한 불변성 ([Permutation Invariance](../permute-equivar-invar-graph))
  $\rightarrow$ 이미지에서는 픽셀 위치가 고정되어 있지만, 그래프에서는 노드 순서가 의미 없으므로,
  이웃 노드들의 순서에 영향을 받지 않는 연산이 필요하다.

* 공간 구조가 정형적이지 않다
  $\rightarrow$ 이미지나 시계열 데이터와 달리 그래프는 grid 형태가 아니므로, convolution이라는 연산 개념을 재정의 해야 한다.

이런 제약을 해결하기 위해 **Graph Convolution**(GCN)이 사용된다.
GCN은 이웃 노드들의 정보를 정규화된 방식으로 aggregation 하고,
그 후 학습 가능한 weight를 이용해 transformation하는 방식으로 작동한다.
이는 CNN이 local receptive field에서 feature를 추출하듯, 그래프에서도 local neighborhood의 정보를 추출하는 방식으로 이해할 수 있다.

<div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
  <div style="text-align: center;">
    <img src="{{page.img_pth}}GCN_vs_CNN.webp" alt="GNN vs CNN neighborhood aggregation" width="400">
    <p>GNN message passing (left) vs. CNN receptive field (right).</p>
  </div>
  <div style="text-align: center;">
    <img src="{{page.img_pth}}cnngcn_receptive_field.png" alt="CNN vs GCN structure" width="400">
    <p>CNN on grid data (a) vs. GCN on graph data (b).</p>
  </div>
</div>

결과적으로, GCN은 다음과 같은 CNN의 특성을 그래프의 특성에 맞게 일반화한 모델이라 할 수 있다:

| CNN 특성                     | GCN에서의 일반화 방식                                 |
| -------------------------- | --------------------------------------------- |
| Local receptive field      | 이웃 노드 (adjacent nodes)                        |
| Convolution (weighted sum) | 메시지 패싱 + 정규화된 합산 (e.g. \\(D^{-1/2} A D^{-1/2}\\)) |
| Weight sharing             | 공통 Linear Layer 적용 (전 노드 공유)                  |


## GCN이란?

GCN은 그래프 위에서 작동하는 신경망으로, 각 노드는 이웃 노드의 정보를 feature aggregation 한 후, 자신의 feature를 update 한다. GCN의 Input과 Output은 아래 그림과 같이 간단히 표현 될 수 있다. (input feature size = 4, output feature size = 2)

<div style="text-align: center;">
  <img src="{{page.img_pth}}GCN_output_vectors_per_node.webp" alt="graph convolution" width="700">
</div>

일반적인 GCN은 정규화된 인접행렬을 통해 표현 될 수 있다:

\\[
H^{(l+1)} = \sigma\left(D^{-\frac{1}{2}} (A + I) D^{-\frac{1}{2}} H^{(l)} W^{(l)}\right)
\\]

여기서:

- \\(A\\) ∈ ℝⁿˣⁿ : The adjacency matrix (인접행렬) 
- \\(I\\) ∈ ℝⁿˣⁿ : Identity matrix (self-loops을 추가하기 위함)  
- \\(D\\) ∈ ℝⁿˣⁿ : \\(A + I\\) 에 대한 degree matrix 
- \\(H^{(l)}\\) ∈ ℝⁿˣᵈ : layer \\( l \\)의 노드 feature matrix  
- \\(W^{(l)}\\) ∈ ℝᵈˣʷ : layer \\( l \\)의 학습할 가중치 행렬  
- \\(σ(·)\\) : Activation function

직관적으로 수식을 이해한다면, 아래 수식을 참고:

<div style="text-align: center;">
  <img src="{{page.img_pth}}GCN_layer_equation_annotated.png" alt="GCNequation" width="400">
</div>

## 인접행렬과 Degree 행렬

### 인접행렬 \\( A \\)

$$
A_{ij} := 
\begin{cases}
1 & \text{if there is an edge between node i and j} \\
0 & \text{otherwise}
\end{cases}
$$

### Degree 행렬 \\( D \\)

노드 i의 degree를 \\( D_{ii} = \sum_j A_{ij} \\)로 계산  
즉, 인접행렬의 row별 합을 대각선에 넣은 **대각행렬**


## GCN 수식 다시 정리

정규화 방식은 크게 두 가지:

| 방식                  | 수식                                            | 특징              |
|-----------------------|--------------------------------------------------|-------------------|
| Row-normalized        | \\( D^{-1} A \\)                                   | 평균 메시지       |
| Symmetric-normalized  | \\( D^{-1/2} A D^{-1/2} \\)                         | GCN에서 사용됨     |

GCN은 self-loop를 포함한 정규화된 형태를 사용:

\\[
\tilde{A} = \hat{D}^{-1/2} \hat{A} \hat{D}^{-1/2}
\\]

그래서 전체 수식은:

\\[
H^{(l+1)} = \sigma(\tilde{A} H^{(l)} W^{(l)})
\\]


## 왜 정규화하는가?
기존에 feature node i 에 대한 정보를 aggregate 한다고 하면,

$$
\bar{\mathbf{x}}_i = \sum_{j \in \text{Neigh}(i)} \mathbf{x}_j
$$

- 여기서 \\(\text{Neigh}(i)\\)는 노드 \\(i\\)의 이웃 집합
- 단순히 이웃 노드들의 feature를 모두 합산하는 방식

처럼 표현 할 수 있다. 하지만, 아래와 같은 문제점이 발생 할 수 있다.

### 문제:
- 이웃이 많은 노드는 많은 feature를 받음 → gradient 폭발/소실 위험
- Neighbour 연결 수 차이에 따른 스케일 불균형

### 해결:
- row 정규화: 평균 
- symmetric 정규화: 노드 간 influence를 degree 기준으로 균등하게

이 아이디어는, neighboring node feature 의 sum 대신 mean 을 사용하여 위 문제점을 해결하고자 하는 방법이였다. 즉,

$$
\bar{\mathbf{x}}_i = \frac{1}{|\text{Neigh}(i)|} \sum_{j \in \text{Neigh}(i)} \mathbf{x}_j
$$

이렇게 하면 노드마다 집계된 벡터의 크기를 이웃 수와 무관하게 일정하게 유지할 수 있기 때문이다.


### 직관:
- 이웃이 많은 노드의 영향력을 줄이고
- 작은 degree 노드도 무시되지 않도록 함

<div style="text-align: center;">
  <img src="{{page.img_pth}}GCN_compare_graph_norm.webp
" alt="GCN Normalization Comparison" width="700">
  <p>mean normalization vs. alternative normalization</p>
</div>

GNN에서 노드의 이웃 정보를 집계할 때, 이웃 노드들의 중요도를 어떻게 계산하느냐에 따라 결과가 달라질 수 있다. 위 그림은 mean normalization 과 alternative normalization의 차이를 보여준다.

왼쪽 그림에서는 mean normalization를 사용한 경우로, node 4는 자신을 포함한 모든 이웃들로부터 동일한 비중으로 정보를 받는걸 확인 할 수 있다.  
반면 오른쪽 그림에서는 alternative normalization를 사용한 경우로, 이웃이 적은 node 5는 더 높은 가중치를 받고, 이웃이 많은 node 1은 상대적으로 낮은 가중치를 받는다.

이러한 정규화 방식의 선택은 모델의 성능과 표현력에 큰 영향을 미칠 수 있고, 특히 이웃 수가 비대칭적인 그래프에서는 alternative normalization가 더 효과적인 결과를 낼 수 있기 때문에 위처럼 사용된다.

## 직접 계산 예시

### 예제 그래프
간단한 그래프를 생각해보자.

```text
A -- B -- C

index: 0   1   2
```

### 원래 인접행렬 \\( A \\)

\\[
A =
\begin{bmatrix}
0 & 1 & 0 \cr
1 & 0 & 1 \cr
0 & 1 & 0
\end{bmatrix}
\\]

### Self-loop 추가: \\( \hat{A} = A + I \\)

\\[
\hat{A} =
\begin{bmatrix}
1 & 1 & 0 \cr
1 & 1 & 1 \cr
0 & 1 & 1
\end{bmatrix}
\\]

### Degree 행렬 \\( \hat{D} \\)

\\[
\hat{D} = \text{diag}(2, 3, 2)
\\]

### Mean normalization

\\[
\hat{D}^{-1} \hat{A} \approx
\begin{bmatrix}
  0.50 & 0.50 & 0.00\cr
  0.33 & 0.33 & 0.33\cr
  0.00 & 0.50 & 0.50
\end{bmatrix}
\\]

### Alternative normalization

\\[
\tilde{A} = \hat{D}^{-1/2} \hat{A} \hat{D}^{-1/2}
\\]


\\[
\tilde{A} \approx
\begin{bmatrix}
0.500 & 0.408 & 0.00 \cr
0.408 & 0.333 & 0.408 \cr
0.00 & 0.408 & 0.500
\end{bmatrix}
\\]


## PyG로 구현

### 기본 GCN 2-layer

```python
from torch_geometric.nn import GCNConv

class GCN(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = GCNConv(in_channels, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, out_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = torch.relu(x)
        x = self.conv2(x, edge_index)
        return x
```


##  MessagePassing 기반 직접 구현

```python
from torch_geometric.nn import MessagePassing

class GCNLayer(MessagePassing):
    def __init__(self, in_channels, out_channels):
        super().__init__(aggr='add')
        self.lin = torch.nn.Linear(in_channels, out_channels)

    def forward(self, x, edge_index):
        x = self.lin(x)
        return self.propagate(edge_index, x=x)

    def message(self, x_j):
        return x_j
```

여러 레이어로 구성하려면:

```python
class GCN(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.layer1 = GCNLayer(3, 8)
        self.layer2 = GCNLayer(8, 2)

    def forward(self, x, edge_index):
        x = self.layer1(x, edge_index)
        x = torch.relu(x)
        x = self.layer2(x, edge_index)
        return x
```


## 핵심 요약

| 구성 요소                                   | 의미                            |
| --------------------------------------- | ----------------------------- |
| \\(A\\)                                     | 인접행렬 (이웃 관계)                  |
| \\(D\\)                                     | 노드 degree 행렬                  |
| \\(\hat{A} = A + I\\)                       | self-loop 포함                  |
| \\(\hat{D}^{-1/2} \hat{A} \hat{D}^{-1/2}\\) | 대칭 정규화 adjacency              |
| \\(H^{(l+1)}\\)                             | 이웃과 자신의 정보를 합쳐 얻은 새로운 feature |


## 참고자료

- *<https://mbernste.github.io/posts/gcn/>*
- *<https://www.cs.mcgill.ca/~wlh/grl_book/>*