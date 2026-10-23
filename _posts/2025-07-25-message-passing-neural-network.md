---
title: Message Passing Neural Network
date: 2025-07-25 11:20:00 +0900
categories: [AI, Graph]
tags: [graph, gnn, mpnn, message passing, pytorch geometric]
use_math: true
---

## Message Passing Neural Networks (MPNN): 직관부터 수식까지 완전 정복

**Message Passing Neural Networks (MPNN)**는 그래프 데이터를 다루는 가장 일반적인 GNN 프레임워크다.
GCN, GAT, GraphSAGE 등 다양한 GNN은 사실상 MPNN의 특수 케이스라고 할 수 있다.  
이 페이지에서는 내가 공부한 MPNN의 전체 구조를 직관적 설명 → 수식 → 예시까지 단계별로 자세히 설명하는 것이 목적이다.

## 기본 구조: MPNN란?

MPNN은 그래프의 노드들이 이웃 노드로부터 메시지를 받고, 자신을 업데이트하는 구조이다.

MPNN의 핵심은 2단계:

1. **Message 단계**: 이웃 노드로부터 메시지를 받음  
2. **Update 단계**: 받은 메시지를 기반으로 노드 상태를 갱신

이 과정을 여러 레이어 (step) 동안 반복하여 점점 더 넓은 범위의 이웃 정보를 반영할 수 있다.


## 수식으로 보는 MPNN

MPNN의 일반 수식은 다음과 같다:

\\[
    h_i^{(l+1)} = \text{UPDATE}^{(l)} \left(
    h_i^{(l)},\ 
    \underset{j \in \mathcal{N}(i)}{\text{AGG}} \left(
        \text{MESSAGE}^{(l)}\left(
            h_i^{(l)},\ h_j^{(l)},\ e_{ij}
        \right)
    \right)
    \right)
\\]

| 기호               | 의미                                              |
| ---------------- | ------------------------------------------------- |
| \\( h_i^{(l)} \\)      | 노드 \\( i \\)의 현재 레이어 \\( l \\)에서의 임베딩           |
| \\( h_i^{(l+1)} \\)    | 다음 레이어에서의 임베딩                               |
| \\( \mathcal{N}(i) \\) | 노드 \\( i \\)의 이웃 노드 집합                          |
| \\( e_{ij} \\)         | edge \\( j \to i \\)의 feature (선택적)              |
| MESSAGE          | 메시지를 계산하는 함수 (보통 MLP, Attention 등)          |
| AGG              | 메시지 집계 함수 (sum, mean, max 등)                    |
| UPDATE           | 메시지 집계 결과로 노드를 갱신하는 함수 (MLP, GRU 등)       |


### 1. 메시지 계산 (Message Function)

\\[
    m_{ij}^{(l)} = \text{Message}\left(h_i^{(l)}, h_j^{(l)}, e_{ij}\right)
\\]

- \\( h_j^{(l)} \\): source 노드 j의 feature
- \\( h_i^{(l)} \\): target 노드 i의 feature
- \\( e_{ij} \\): edge (j → i)의 feature
- \\( m_{ij}^{(l)} \\): j → i 로 보내는 메시지

메시지는 보통 MLP, attention, gating 등으로 구성됨.


### 2. 메시지 집계 (Aggregation)

\\[
m_i^{(l)} = \text{AGGREGATE} \left( \{ m_{ij}^{(l)} \mid j \in \mathcal{N}(i) \} \right)
\\]

- 이웃 j로부터 받은 모든 메시지를 하나로 합친다.  
- 합(sum), 평균(mean), 최대값(max), attention-weighted sum 등 다양하다.

### 3. 노드 상태 업데이트 (Update Function)

\\[
h_i^{(l+1)} = \text{Update}\left(h_i^{(l)}, m_i^{(l)}\right)
\\]

- 업데이트는 보통 MLP 또는 GRU, residual connection 등으로 구현됨.

<div style="display: flex; align-items: center; justify-content: center;">
  <div style="margin-right: 20px; text-align: center;">
    <img src="{{page.img_pth}}graph_target_node.png" width="250">
    <p style="font-size: 14px;">Graph with target node A</p>
  </div>
  <div style="margin-left: 20px; text-align: center;">
    <img src="{{page.img_pth}}graph_target_node_aggregation.png" width="400">
    <p style="font-size: 14px;">Neighbor message aggregation into node A</p>
  </div>
</div>

## 직관 요약

| 단계 | 수식 | 설명 |
|------|------|------|
| 메시지 전송 | \\( m_{ij} = \text{msg}(h_i, h_j, e_{ij}) \\) | 이웃 노드의 정보와 엣지를 활용해 메시지를 계산 |
| 집계 | \\( m_i = \text{AGG}(\{m_{ij}\}) \\) | 여러 이웃에서 받은 메시지를 통합 |
| 업데이트 | \\( h_i' = \text{update}(h_i, m_i) \\) | 노드 상태를 새롭게 갱신 |

## 예제: 간단한 메시지 연산

노드 feature \\( h \in \mathbb{R}^3 \\),  
edge feature \\( e \in \mathbb{R}^2 \\) 라고 가정:

\\[
h_i^{(l+1)} = \sigma \left( W \cdot \left(
\sum_{j \in \mathcal{N}(i)} \phi(h_j^{(l)}, e_{ij})
\right) \right)
\\]

* \\(\phi\\): 메시지 함수 (e.g. concat 후 MLP)
* \\(W\\): 노드 업데이트 weight
* \\(\sigma\\): 비선형함수 (ReLU 등)


```python
edge_index = [[0, 1], [1, 2]]  => 0 -> 1, 1 -> 2
h = [ [0.1, 0.2, 0.3],    # Node 0
       [0.4, 0.5, 0.6],    # Node 1
       [0.7, 0.8, 0.9] ]   # Node 2

e = [ [1.0, 0.0],          # Edge 0->1
      [0.5, 1.0] ]         # Edge 1->2

message: concat(h_j, e_ij) -> MLP -> m_ij
aggregation: sum
update: h_i <- h_i + m_i
```


## PyTorch Geometric에서의 MPNN 구현

PyG의 핵심 추상 클래스는 `MessagePassing`이다:

```python
class MyMPNN(MessagePassing):
    def __init__(self):
        super().__init__(aggr='add')  # 'mean', 'max'도 가능
        self.mlp = nn.Sequential(
            nn.Linear(in_channels + edge_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, out_channels)
        )

    def forward(self, x, edge_index, edge_attr):
        return self.propagate(edge_index, x=x, edge_attr=edge_attr)

    def message(self, x_j, edge_attr):
        return self.mlp(torch.cat([x_j, edge_attr], dim=1))

    def update(self, aggr_out):
        return aggr_out
```

[손계산 비교](https://github.com/Junibuni/mpnn_scratch/blob/master/mpnn_test/mpnn_test.ipynb)

## 장점
MPNN 구조의 주요 강점은 그래프의 **구조적 정보**와 **feature**정보를 동시에 포착할 수 있다는 점이다. 즉, 특정 노드의 임베딩을 계산할 때 해당 노드는 자신의 k-hop 이웃들로부터 정보를 수집하게 되며, 이를 통해 어떤 노드들과 연결되어 있는지를 반영한 구조적 특성을 포함할 수 있다는게 장점이다. 또한, 이웃 노드들의 feature 값들까지 함께 aggregate 하므로, 단순한 연결 관계뿐만 아니라 노드들이 지닌 실제 feature 도 임베딩에 반영 된다는 장점이 있다.

## 다양한 GNN = MPNN의 특수한 케이스

MPNN 프레임워크를 따르는 GNN 모델은 굉장히 많다.

| GNN 종류            | message 형태                    | update 방식   |
| ----------------- | ----------------------------- | ----------- |
| **GCN**           | \\(m = h_j\\)                     | 평균 후 Linear | 
| **GraphSAGE**     | \\(m = \text{concat}(h_i, h_j)\\) | MLP         |
| **GAT**           | attention weighted sum        | MLP         | 
| **NNConv (MPNN)** | \\(m = f(e_{ij}) \cdot h_j\\)     | 합 후 Linear |


## 요약 정리

* MPNN은 GNN의 핵심: **메시지 → 집계 → 업데이트**
* 이 과정을 반복하며, 그래프 구조 내에서 정보를 확산시키는 것
* 다양한 GNN은 MPNN을 변형한 것
* `MessagePassing` 클래스를 사용하면 직접 커스텀 가능 (Aggregation method 등)


## 참고자료

- *<https://arxiv.org/abs/1704.01212>*
- *<https://pytorch.org/docs/stable/generated/torch.einsum.html>*
- *<https://pytorch-geometric.readthedocs.io/en/latest/notes/create_gnn.html>*
- *<https://www.cs.mcgill.ca/~wlh/grl_book/>*