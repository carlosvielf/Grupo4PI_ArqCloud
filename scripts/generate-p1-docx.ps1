$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Resolve-Path '.').Path
$template = Join-Path $root 'P1_IAL214_template.docx'
$output = Join-Path $root 'P1_IAL214_Grupo4.docx'
$build = Join-Path $root 'docs\p1\.docx-build'
if (Test-Path -LiteralPath $build) { Remove-Item -LiteralPath $build -Recurse -Force }
New-Item -ItemType Directory -Path $build | Out-Null
[IO.Compression.ZipFile]::ExtractToDirectory($template, $build)

function X([string]$value) { [Security.SecurityElement]::Escape($value) }
$script:body = [Text.StringBuilder]::new()
function Add-Raw([string]$xml) { [void]$script:body.Append($xml) }
function Run([string]$text, [bool]$bold=$false, [int]$size=21, [string]$font='Arial') {
  $props = '<w:rPr>' + $(if($bold){'<w:b/>'}else{''}) + "<w:rFonts w:ascii=`"$font`" w:hAnsi=`"$font`"/><w:sz w:val=`"$size`"/><w:szCs w:val=`"$size`"/></w:rPr>"
  return "<w:r>$props<w:t xml:space=`"preserve`">$(X $text)</w:t></w:r>"
}
function Add-P([string]$text, [string]$style='Normal', [bool]$bold=$false, [string]$align='', [bool]$pageBreak=$false, [int]$size=21) {
  $pPr = '<w:pPr>' + $(if($style){"<w:pStyle w:val=`"$style`"/>"}else{''}) + $(if($align){"<w:jc w:val=`"$align`"/>"}else{''}) + $(if($pageBreak){'<w:pageBreakBefore/>'}else{''}) + '<w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr>'
  Add-Raw "<w:p>$pPr$(Run $text $bold $size)</w:p>"
}
function Add-LabelP([string]$label, [string]$text) {
  Add-Raw "<w:p><w:pPr><w:spacing w:after=`"120`" w:line=`"300`" w:lineRule=`"auto`"/></w:pPr>$(Run $label $true 21)$(Run $text $false 21)</w:p>"
}
function Add-Code([string]$text) {
  $runs = ($text -split "`r?`n" | ForEach-Object { (Run $_ $false 16 'Consolas') + '<w:r><w:br/></w:r>' }) -join ''
  Add-Raw "<w:p><w:pPr><w:shd w:val=`"clear`" w:fill=`"F1F4F2`"/><w:spacing w:before=`"80`" w:after=`"120`"/></w:pPr>$runs</w:p>"
}
function Add-Table([object[]]$rows, [bool]$header=$true) {
  $xml = [Text.StringBuilder]::new('<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>')
  for($i=0;$i -lt $rows.Count;$i++) {
    [void]$xml.Append('<w:tr>')
    foreach($cell in $rows[$i]) {
      $shade = if($header -and $i -eq 0){'<w:shd w:val="clear" w:fill="E7F1EA"/>'}else{''}
      [void]$xml.Append("<w:tc><w:tcPr><w:tcW w:w=`"0`" w:type=`"auto`"/>$shade</w:tcPr><w:p><w:pPr><w:spacing w:after=`"30`"/></w:pPr>$(Run ([string]$cell) ($header -and $i -eq 0) 18)</w:p></w:tc>")
    }
    [void]$xml.Append('</w:tr>')
  }
  [void]$xml.Append('</w:tbl><w:p/>')
  Add-Raw $xml.ToString()
}
function Add-Image([string]$rid, [int]$id, [string]$name, [long]$cx, [long]$cy, [string]$caption, [bool]$pageBreak=$false) {
  $break = if($pageBreak){'<w:pageBreakBefore/>'}else{''}
  Add-Raw @"
<w:p><w:pPr>$break<w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="$cx" cy="$cy"/><wp:docPr id="$id" name="$(X $name)"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="$id" name="$(X $name)"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="$rid"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="$cx" cy="$cy"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
"@
  Add-P $caption 'Normal' $false 'center' $false 18
}

# Capa preserva o conteúdo e a organização do modelo oficial.
Add-P 'FATEC POMPEIA' 'Title' $true 'center' $false 36
Add-P 'Projeto Integrador de Arquiteturas Cloud para Big Data · IAL214 · BIG_DATA_AGRONEGÓCIO_T' 'Normal' $false 'center' $false 21
Add-P 'P1' 'Title' $true 'center' $false 64
Add-P 'Estudo dos dados, arquitetura e escopo do sistema web' 'Title' $true 'center' $false 38
Add-P 'Avaliação em grupo · entrega individual · 2026.2' 'Normal' $false 'center'
Add-P 'Grupo 4 — Fazenda São João' 'Heading1' $true 'center' $false 30
Add-Table @(
  @('Nº','Integrante','RA'),
  @('1','CARLOS ROBERTO VIEL FILHO','2591262422008'),
  @('2','GABRIEL RIBAS FERREIRA DE ALMEIDA','2591262422003'),
  @('3','OLDINEY NATANAEL GALVÃO','2591262422021'),
  @('4','MATHEUS MÁXIMO DANELUTI PAIVA','2591262422022')
)
Add-P 'Prof. Allan Lincoln Rodrigues Siriani' 'Normal' $false 'center'
Add-P 'Pompeia, 07/10/2026' 'Normal' $false 'center'

Add-P 'Sumário' 'Heading1' $false '' $true
@('1. Grupo e fazenda','2. Estudo dos dados','2.1 Consulta 1 — Composição da fazenda','2.2 Consulta 2 — Evolução do NDVI','2.3 Consulta 3 — Alertas de solo seco','2.4 Consulta 4 — Perfil das máquinas','2.5 Consulta 5 — Umidade atual','3. Qualidade dos dados','4. Arquitetura atual','5. Escopo do sistema web','5.1 Problema e usuários','5.2 Requisitos','5.3 Telas','5.4 De onde vem cada informação','6. Arquitetura proposta e plano','6.1 Arquitetura proposta','6.2 Cronograma até a P2','6.3 Divisão de tarefas','Declaração') | ForEach-Object { Add-P $_ }

Add-P '1. Grupo e fazenda' 'Heading1' $false '' $true
Add-Table @(
 @('Grupo','Grupo 4'),
 @('Fazenda','Fazenda São João — Quintana/SP — 296,91 ha'),
 @('Culturas','Cana-de-açúcar (T01–T04) e soja (T05–T06)'),
 @('Repositório GitHub','https://github.com/carlosvielf/Grupo4PI_ArqCloud.git'),
 @('Portas do grupo','API 3001; MariaDB 3307; MongoDB 27018; Redis 6380; MQTT 1884/9012; MinIO 9010; Vite local 5173/5175')
) $false
Add-P 'Fazenda, município, área e culturas foram consultados no MariaDB e confrontados com o Redis. A relação de integrantes e RAs foi informada diretamente pelo grupo para esta versão final.'

Add-P '2. Estudo dos dados' 'Heading1'
Add-Table @(
 @('Serviço','O que guarda','Quantidade','Período','Consulta usada'),
 @('MariaDB','cadastros, safras, operações, estoque e vendas','12 tabelas; 559 linhas','15/03/2021–18/01/2027','information_schema; COUNT/MIN/MAX'),
 @('MongoDB','leituras, telemetria, alertas e catálogo NDVI','4 coleções; 87.174 documentos','01/06/2026–07/10/2026','countDocuments; aggregate'),
 @('Redis','estado, talhões, stream, alertas, ranking e contadores','19 chaves grupo4:*','estado em 07/10; sem histórico próprio','SCAN; TYPE; TTL'),
 @('MQTT','status e sete sensores','9 mensagens/75,023 s; 8 tópicos','janela passiva em 07/10','SUBSCRIBE fazenda/grupo4/#'),
 @('MinIO','48 PNGs NDVI e um laudo CSV','49 objetos; 3.299.616 bytes','imagens 05/06–25/09/2026','bucketExists; listObjectsV2')
)
Add-P 'Contagens congeladas em 08/10/2026 00:27:23 UTC. A coleção leituras recebe fluxo e pode crescer.'

Add-P '2.1 Consulta 1 — Composição da fazenda' 'Heading2'
Add-LabelP 'Pergunta. ' 'Quais talhões, áreas e culturas compõem a Fazenda São João?'
Add-Code @'
SELECT f.nome, f.municipio, f.uf, f.area_total_ha,
       t.codigo AS talhao, t.area_ha, c.nome AS cultura
FROM fazenda f JOIN talhao t ON t.fazenda_id=f.id
LEFT JOIN cultura c ON c.id=t.cultura_atual_id ORDER BY t.codigo;
'@
Add-Table @(@('Talhão','Área (ha)','Cultura'),@('T01','36,53','Cana-de-açúcar'),@('T02','52,00','Cana-de-açúcar'),@('T03','46,62','Cana-de-açúcar'),@('T04','55,19','Cana-de-açúcar'),@('T05','24,30','Soja'),@('T06','36,98','Soja'))
Add-LabelP 'Resultado e interpretação. ' 'Seis talhões somam 251,62 ha produtivos. A fazenda tem 296,91 ha; a diferença de 45,29 ha pode representar áreas não produtivas e não foi rotulada como erro sem evidência adicional.'

Add-P '2.2 Consulta 2 — Evolução do NDVI' 'Heading2'
Add-LabelP 'Pergunta. ' 'Como o NDVI mudou entre a primeira e a última imagem de cada talhão?'
Add-Code 'db.imagens.aggregate([{$match:{ndvi_medio:{$type:"number"},data:{$type:"date"}}},{$sort:{talhao:1,data:1}},{$group:{_id:"$talhao",leituras:{$sum:1},primeiro:{$first:"$ndvi_medio"},ultimo:{$last:"$ndvi_medio"},media:{$avg:"$ndvi_medio"}}}])'
Add-Table @(@('Talhão','Leituras','Primeiro','Último','Variação'),@('T01','8','0,298','0,648','+0,350'),@('T02','8','0,312','0,662','+0,350'),@('T03','8','0,295','0,645','+0,350'),@('T04','8','0,237','0,643','+0,406'),@('T05','8','0,490','0,150','−0,340'),@('T06','8','0,446','0,159','−0,287'))
Add-LabelP 'Resultado e interpretação. ' 'T01–T04 melhoraram; T05 e T06 encerraram o período com forte queda e devem ser priorizados para inspeção, sem tratar NDVI isolado como diagnóstico.'

Add-P '2.3 Consulta 3 — Alertas de solo seco' 'Heading2'
Add-LabelP 'Pergunta. ' 'Quais talhões concentram alertas de solo seco e quantos já foram resolvidos?'
Add-Code 'db.alertas.aggregate([{$match:{tipo:"solo_seco"}},{$group:{_id:"$talhao",ocorrencias:{$sum:1},resolvidas:{$sum:{$cond:["$resolvido",1,0]}},primeira:{$min:"$ts"},ultima:{$max:"$ts"}}},{$sort:{ocorrencias:-1}}])'
Add-Table @(@('Talhão','Ocorrências','Resolvidas'),@('T01','47','47'),@('T02','47','47'),@('T04','45','45'),@('T03','35','35'),@('T05','33','33'),@('T06','33','33'))
Add-LabelP 'Resultado e interpretação. ' 'As 240 ocorrências históricas estavam resolvidas; T01 e T02 concentram 39,2% e merecem análise de recorrência.'

Add-P '2.4 Consulta 4 — Perfil das máquinas' 'Heading2'
Add-LabelP 'Pergunta. ' 'Quais máquinas possuem telemetria e qual foi seu perfil operacional?'
Add-Code 'db.telemetria_maquinas.aggregate([{$group:{_id:"$maquina",registros:{$sum:1},inicio:{$min:"$ts"},fim:{$max:"$ts"},velocidade_media:{$avg:"$velocidade_kmh"},combustivel_medio:{$avg:"$combustivel_pct"},temperatura_maxima:{$max:"$temp_motor_c"}}},{$sort:{registros:-1}}])'
Add-Table @(@('Máquina','Registros','Velocidade média','Combustível médio','Máx. motor'),@('M05','3.685','5,00 km/h','56,46%','97,3 °C'),@('M03','1.573','15,98 km/h','81,09%','95,9 °C'),@('M01','524','6,99 km/h','85,92%','95,9 °C'))
Add-LabelP 'Resultado e interpretação. ' 'Somente três das seis máquinas cadastradas têm telemetria. Ausência de amostras não deve ser exibida como máquina offline.'

Add-P '2.5 Consulta 5 — Umidade atual do solo' 'Heading2'
Add-LabelP 'Pergunta. ' 'Quais são as leituras mais recentes das seis sondas?'
Add-Code "SCAN MATCH grupo4:sensor:SS-* COUNT 100`nHGETALL <cada chave encontrada>"
Add-Table @(@('Sonda','Umidade 10 cm','Umidade 30 cm'),@('SS-01','11,01%','11,95%'),@('SS-02','11,03%','11,60%'),@('SS-03','11,20%','11,90%'),@('SS-04','11,38%','11,96%'),@('SS-05','10,76%','12,18%'),@('SS-06','11,10%','11,85%'))
Add-LabelP 'Resultado e interpretação. ' 'O Redis mostrou 10,76%–11,38% a 10 cm e 11,60%–12,18% a 30 cm. A UI deve exibir também o timestamp porque o estado muda em fluxo.'

Add-P '3. Qualidade dos dados' 'Heading1'
Add-Table @(
 @('Problema','Como foi detectado','Registros afetados','Tratamento no sistema'),
 @('Umidade a 10 cm com -1/999','filtro <0 ou >100 em leituras.valores.umidade_10cm_pct','12 (5 com -1; 7 com 999)','converter em ausência; não agregar; mostrar lacuna/aviso'),
 @('Duplicidade sensor + timestamp','$group por sensor/ts; quantidade > 1','644 linhas em 322 pares; 322 excedentes','deduplicar na leitura; unicidade na ingestão futura'),
 @('Datas posteriores à auditoria','WHERE data > CURRENT_DATE()','20 movimentos; 10 operações; 2 plantios planejados','rotular planejado; excluir de realizado'),
 @('Redis sem expiração','TTL nas 19 chaves grupo4:*','19','calcular frescor por ts; TTL no estado efêmero'),
 @('Imagens simuladas','agrupamento de imagens.satelite','48 de 48','manter rótulo Sentinel-2 (simulado)')
)
Add-P 'Testes sem ocorrências: NDVI/nuvem fora da faixa, telemetria negativa, combustível fora de 0–100, fim antes do início, colheita antes do plantio, áreas/vendas não positivas, códigos duplicados e divergência MongoDB/MinIO.'

Add-P '4. Arquitetura atual' 'Heading1' $false '' $true
Add-Image 'rIdP1ArchCurrent' 101 'Arquitetura atual' 5760720 3240435 'Figura 1 — Arquitetura atual dos dados da Fazenda São João.'
Add-P 'Sensores publicam no MQTT; o backend assina o prefixo do Grupo 4 e, com persistência habilitada, faz upsert no MongoDB. A API consulta MariaDB, MongoDB, Redis e MinIO; o navegador recebe JSON, imagens mediadas e SSE. A carga inicial dos acervos externos não está versionada.'
Add-P 'MariaDB mantém relações/transações; MongoDB séries e eventos; Redis estado recente; MinIO binários; MQTT desacopla sensores e consumidor. O backend protege credenciais e normaliza os schemas.'

Add-P '5. Escopo do sistema web' 'Heading1'
Add-P '5.1 Problema e usuários' 'Heading2'
Add-P 'Problema: dados de campo, imagens, alertas e máquinas estão distribuídos em cinco serviços e contêm sentinelas, duplicatas e ritmos diferentes. Sem integração, o responsável cruza fontes e pode interpretar dado antigo ou inválido como atual.'
Add-P 'Persona: gerente de operação agrícola da Fazenda São João, apoiado pelo agrônomo. O Monitora.G4 centraliza os dados rastreáveis, mostra qualidade/frescor e permite ir do panorama ao talhão, imagem, alerta ou máquina.'
Add-P 'Escopo P2: consolidar dashboard, talhões, imagens/NDVI, alertas e telemetria; tratar os problemas medidos e incluir estado atual das sondas. Custos, vendas, estoque e interpretação do laudo ficam fora do MVP.'
Add-P '5.2 Requisitos' 'Heading2'
Add-Table @(
 @('ID','Tipo','Requisito'),
 @('RF01','funcional','Exibir seis talhões com área, cultura, último NDVI válido e data; sentinelas/duplicatas não entram nas métricas.'),
 @('RF02','funcional','Consultar oito imagens NDVI por talhão, com metadados MongoDB e PNG privado do MinIO.'),
 @('RF03','funcional','Listar e filtrar alertas históricos/recentes com status, severidade, talhão e horário.'),
 @('RF04','funcional','Exibir telemetria de M01/M03/M05 por período/métrica; ausência vira “sem telemetria”, não “offline”.'),
 @('RF05','funcional','Mostrar estado e frescor das seis sondas Redis/MQTT.'),
 @('RNF01','não funcional','Segredos somente no backend; nenhum segredo em VITE_*, bundle, Git, logs ou respostas.'),
 @('RNF02','não funcional','Endpoint em até 15 s ou erro parcial sem fallback para mock; validar por teste integrado.'),
 @('RNF03','não funcional','WCAG 2.1 AA e layout sem rolagem horizontal entre 390 e 1440 px.')
)

Add-P '5.3 Telas' 'Heading2' $false '' $true
Add-Image 'rIdP1Screen1' 102 'Dashboard real' 5760720 4000500 'Figura 2 — Tela 1: Dashboard real em modo API.'
Add-Image 'rIdP1Screen2' 103 'Talhões reais' 5760720 4000500 'Figura 3 — Tela 2: Talhões reais.' $true
Add-Image 'rIdP1Screen3' 104 'Imagens reais' 5760720 4000500 'Figura 4 — Tela 3: Galeria MongoDB/MinIO.' $true
Add-Image 'rIdP1Screen4' 105 'Telemetria real' 5760720 4000500 'Figura 5 — Tela 4: Telemetria histórica.' $true
Add-Image 'rIdP1Screen5' 106 'Alertas reais' 5760720 4000500 'Figura 6 — Tela 5: Central de alertas.' $true

Add-P '5.4 De onde vem cada informação' 'Heading2'
Add-Table @(
 @('Tela','Informação exibida','Serviço','Estrutura'),
 @('Dashboard/Talhões','código, área e cultura','MariaDB','talhao JOIN cultura'),
 @('Dashboard/Talhões','último NDVI e evolução','MongoDB','imagens.talhao/data/ndvi_medio'),
 @('Dashboard/Alertas','histórico','MongoDB','alertas'),
 @('Dashboard/Alertas','recentes','Redis','grupo4:alertas:recentes'),
 @('Imagens','catálogo/data/tipo/satélite','MongoDB','imagens'),
 @('Imagens','conteúdo PNG','MinIO','bucket grupo4; imagens.objeto'),
 @('Máquinas/Telemetria','cadastro e métricas','MariaDB + MongoDB','maquina + telemetria_maquinas'),
 @('Dashboard/Talhão (P2)','umidade e frescor','Redis + MQTT','grupo4:sensor:SS-*; fazenda/grupo4/sensores/*')
)

Add-P '6. Arquitetura proposta e plano' 'Heading1' $false '' $true
Add-P '6.1 Arquitetura proposta' 'Heading2'
Add-Image 'rIdP1ArchProposed' 107 'Arquitetura proposta' 5760720 3240435 'Figura 7 — Arquitetura proposta até a P2.'
Add-P 'Decisão: monólito modular. Um container Node servirá o frontend compilado, API e consumidor MQTT na porta 3001. Para uma equipe acadêmica pequena e seis semanas, microsserviços acrescentariam deploy, rede e coordenação sem requisito de escala comprovado.'
Add-P 'MariaDB 3307, MongoDB 27018, Redis 6380, MQTT 1884/9012 e MinIO 9010 continuam externos. Secrets chegam por variáveis protegidas do runtime. A camada de qualidade remove sentinelas/duplicatas, distingue planejamento de realizado e avalia frescor do Redis.'

Add-P '6.2 Cronograma até a P2 (17/11)' 'Heading2'
Add-Table @(
 @('Semana','Entrega do grupo'),
 @('08/10 – 14/10','Fechar P1; priorizar backlog; testes para sentinelas, duplicatas, datas futuras e frescor.'),
 @('15/10 – 21/10','Normalização/deduplicação da API; planejado x realizado; Dockerfile e secrets.'),
 @('22/10 – 28/10','Estado Redis/MQTT das seis sondas no dashboard/detalhe; timestamp e testes de contrato.'),
 @('29/10 – 04/11','Revisar alertas/telemetria, limites, falhas parciais, imagem privada e segredos.'),
 @('05/11 – 11/11','Homologação, E2E real, acessibilidade, responsividade, desempenho e validação.'),
 @('12/11 – 17/11','Correções, relatório, vídeo, sistema no ar e entrega P2.')
)
Add-P '6.3 Divisão de tarefas' 'Heading2'
Add-Table @(
 @('Integrante','Responsabilidades nesta P1 e no projeto'),
 @('CARLOS ROBERTO VIEL FILHO','Frontend e experiência: integrar sondas ao dashboard/detalhe, revisar alertas e telemetria, garantir responsividade/acessibilidade e apoiar correções finais.'),
 @('GABRIEL RIBAS FERREIRA DE ALMEIDA','Backend e dados: normalização/deduplicação, planejado x realizado, API, MQTT/Redis e testes de integração dos serviços.'),
 @('OLDINEY NATANAEL GALVÃO','Infraestrutura e segurança: container, variáveis/secrets, homologação, sistema no ar, disponibilidade e falhas parciais.'),
 @('MATHEUS MÁXIMO DANELUTI PAIVA','Qualidade e entrega: testes de contrato/E2E/acessibilidade/desempenho, evidências, relatório, vídeo e coordenação da entrega P2.')
)

Add-P 'Declaração' 'Heading1'
Add-P 'Declaramos que este documento foi elaborado pelos integrantes listados na capa, que as consultas e resultados apresentados foram executados sobre os dados do nosso grupo, e que a contribuição de cada integrante está descrita na seção 6.3.'

$documentPath = Join-Path $build 'word\document.xml'
$old = Get-Content -Raw -LiteralPath $documentPath
$sect = [regex]::Match($old, '<w:sectPr[\s\S]*?</w:sectPr>').Value
$xml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>$($script:body.ToString())$sect</w:body></w:document>
"@
[IO.File]::WriteAllText($documentPath, $xml, [Text.UTF8Encoding]::new($false))

$media = Join-Path $build 'word\media'
New-Item -ItemType Directory -Path $media -Force | Out-Null
$images = @{
 'arch-current.png'='docs\p1\evidencias\arquitetura-atual.png';
 'screen-1.png'='docs\p1\evidencias\tela-1-dashboard.png';
 'screen-2.png'='docs\p1\evidencias\tela-2-talhoes.png';
 'screen-3.png'='docs\p1\evidencias\tela-3-imagens.png';
 'screen-4.png'='docs\p1\evidencias\tela-4-telemetria.png';
 'screen-5.png'='docs\p1\evidencias\tela-5-alertas.png';
 'arch-proposed.png'='docs\p1\evidencias\arquitetura-proposta.png'
}
foreach($item in $images.GetEnumerator()) { Copy-Item -LiteralPath (Join-Path $root $item.Value) -Destination (Join-Path $media $item.Key) -Force }

$relsPath = Join-Path $build 'word\_rels\document.xml.rels'
$rels = Get-Content -Raw -LiteralPath $relsPath
$newRels = @'
<Relationship Id="rIdP1ArchCurrent" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/arch-current.png"/>
<Relationship Id="rIdP1Screen1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/screen-1.png"/>
<Relationship Id="rIdP1Screen2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/screen-2.png"/>
<Relationship Id="rIdP1Screen3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/screen-3.png"/>
<Relationship Id="rIdP1Screen4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/screen-4.png"/>
<Relationship Id="rIdP1Screen5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/screen-5.png"/>
<Relationship Id="rIdP1ArchProposed" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/arch-proposed.png"/>
'@
$rels = $rels -replace '</Relationships>', ($newRels + '</Relationships>')
[IO.File]::WriteAllText($relsPath, $rels, [Text.UTF8Encoding]::new($false))

$typesPath = Join-Path $build '[Content_Types].xml'
$types = Get-Content -Raw -LiteralPath $typesPath
if($types -notmatch 'Extension="png"') { $types = $types -replace '</Types>', '<Default Extension="png" ContentType="image/png"/></Types>' }
[IO.File]::WriteAllText($typesPath, $types, [Text.UTF8Encoding]::new($false))

if(Test-Path -LiteralPath $output) { Remove-Item -LiteralPath $output -Force }
$fileStream = [IO.File]::Open($output, [IO.FileMode]::CreateNew)
try {
  $archive = [IO.Compression.ZipArchive]::new($fileStream, [IO.Compression.ZipArchiveMode]::Create, $false)
  try {
    Get-ChildItem -LiteralPath $build -File -Recurse | ForEach-Object {
      $relative = $_.FullName.Substring($build.Length + 1).Replace('\','/')
      $entry = $archive.CreateEntry($relative, [IO.Compression.CompressionLevel]::Optimal)
      $target = $entry.Open()
      $source = [IO.File]::OpenRead($_.FullName)
      try { $source.CopyTo($target) } finally { $source.Dispose(); $target.Dispose() }
    }
  } finally { $archive.Dispose() }
} finally { $fileStream.Dispose() }
Remove-Item -LiteralPath $build -Recurse -Force
Write-Output $output
