# Datas e timezone no banco

O padrão do Paradox Cards é armazenar instantes em colunas timestamptz (timestamp with time zone), usar UTC nas conexões da aplicação e migrations e retornar datas ISO 8601 com indicação de fuso. Conversão para o horário local pertence à apresentação. A região São Paulo da infraestrutura não muda o padrão UTC dos dados.

As colunas temporais já foram criadas como timestamptz. A migration de padronização de users também usa esse tipo em updated_at e email_verified_at. As migrations já aplicadas permanecem intactas. Toda nova coluna de instante deve seguir esse tipo; datas de calendário sem horário exigem uma decisão separada.

O adaptador configura SET TIME ZONE 'UTC' em cada nova conexão, incluindo as conexões diretas usadas pelos comandos administrativos. O runner de migrations da Vercel também aplica essa configuração antes de executar as migrations.

O Trama usa timestamptz e defaults timezone('utc', now()). Aqui preservamos now() nos defaults de colunas timestamptz: ele já representa um instante com timezone. timezone('utc', now()) retorna timestamp sem timezone e, ao ser atribuído a timestamptz, depende do fuso da sessão para voltar a representar um instante. Copiar essa conversão pode deslocar horários em conexões configuradas fora de UTC.

Sessões continuam com 24 horas de inatividade e sete dias absolutos; reservas continuam com 60 segundos. Para durações decorridas, use intervalos em horas/segundos e preserve os offsets nas entradas; não converta para horário local antes de persistir.

Os testes de banco iniciam uma conexão com America/Sao_Paulo e verificam que o adaptador aplica UTC. Também verificam os tipos de todas as colunas temporais, os defaults de criação e reserva em UTC, America/Sao_Paulo e America/New_York, e a conversão de um instante com offset -03:00 para ISO UTC. Todas essas verificações usam exclusivamente paradoxcards_test; não corrigem ou reescrevem registros existentes.

Referências: [tipos temporais do PostgreSQL](https://www.postgresql.org/docs/16/datatype-datetime.html), [conversões de timezone e funções de data](https://www.postgresql.org/docs/16/functions-datetime.html).
