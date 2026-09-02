# Plano de Ação — SAEP

Este sistema foi desenvolvido para apoiar a rotina de acompanhamento das ações do SAEP pela equipe interna.
A ideia central é manter um registro único das atividades, com responsabilidade definida, prazo, status e
referência de evidência, evitando dispersão de informação e facilitando o acompanhamento do desempenho do plano.

A ferramenta é utilizada em duas frentes:

- Registro das ações por parte dos colaboradores;
- Supervisão e consolidação por parte da coordenação/gestão.

## Como o sistema funciona

### 1. Estrutura de uso

A aplicação organiza o trabalho em dois perfis principais:

- Colaborador: registra e acompanha as ações sob sua responsabilidade, podendo editar e excluir apenas os itens próprios.
- Administrador: acompanha o conjunto de ações da equipe, acessa o painel geral e pode gerenciar qualquer item do plano.

Esse controle é essencial para manter a autonomia dos responsáveis sem perder a visão gerencial do processo.

### 2. Cadastro e atualização das ações

Cada ação do plano contém os elementos necessários para a execução e o monitoramento:

- título da ação;
- descrição do que será realizado;
- responsável;
- área de atuação;
- prazo;
- status atual;
- evidência ou referência de comprovação.

Esses dados são armazenados em uma base compartilhada e exibidos de forma centralizada, permitindo que a equipe
consiga acompanhar a evolução de cada item em tempo real.

### 3. Fluxo operacional no dia a dia

O fluxo de trabalho é simples e direto:

1. O colaborador identifica uma ação a ser executada.
2. Registra a atividade com descrição, responsável, prazo e status inicial.
3. Atualiza o andamento conforme a execução avança.
4. Inclui a evidência ou referência que comprove a situação.
5. A coordenação acompanha o conjunto e identifica pendências, atrasos ou demandas prioritárias.

Assim, a ferramenta funciona como um sistema de acompanhamento operacional do plano, em vez de apenas um formulário isolado.

### 4. Painel administrativo

No perfil administrativo, a equipe consegue visualizar a situação geral do plano de ação. O painel permite:

- verificar o volume de ações cadastradas;
- acompanhar o andamento do conjunto;
- identificar itens pendentes ou atrasados;
- avaliar a distribuição de responsabilidade;
- exportar os dados em CSV para análise e apresentação.

Esse módulo foi pensado para apoiar decisões e reuniões de acompanhamento sem exigir trabalho manual de consolidação.

### 5. Regras de acesso

O sistema foi construído para respeitar a separação de responsabilidades. O colaborador não altera ações que não são suas,
assim como a administração não depende apenas do bom senso da interface: as regras também são aplicadas no banco de dados.

Isso reduz riscos de inconsistência e mantém a organização do trabalho mais segura.

### 6. Atualização em tempo real

Quando uma ação é criada, atualizada ou removida, as alterações aparecem automaticamente para os usuários conectados.
Esse comportamento facilita a rotina de acompanhamento, porque ninguém precisa ficar recarregando a tela para saber se houve
mudança no plano.

## Papel da equipe

A ferramenta foi pensada para ser usada por toda a equipe envolvida no SAEP, com papéis complementares:

- colaboradores: executam e registram as ações;
- gestores: acompanham o progresso e identificam gargalos;
- coordenação: valida o conjunto e orienta ajustes no plano.

A rotina fica mais clara quando cada pessoa registra sua parte de forma organizada e a gestão tem visão integrada do conjunto.

## Objetivo do projeto

O objetivo principal é centralizar o acompanhamento das ações do SAEP em um ambiente simples, organizado e compartilhado,
permitindo que a equipe tenha visibilidade do trabalho realizado, dos pontos pendentes e dos compromissos em andamento.

Em resumo: o sistema serve como ferramenta de gestão operacional do plano, apoiando a rotina da equipe e a tomada de decisão da coordenação.
