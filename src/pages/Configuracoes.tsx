import { Check, CircleHelp, Database, ShieldCheck } from "lucide-react";
import { endpointConfig, isDemo } from "../services/api";
import { PageHeader, SectionHeader, StatusBadge } from "../components/ui";
export default function Configuracoes() {
  return (
    <>
      <PageHeader
        title="Configurações da operação"
        description="Consulte o ambiente atual e a disponibilidade das fontes de dados."
      />
      <div className="settings-grid">
        <section className="panel">
          <SectionHeader title="Fonte de dados" />
          <div className="settings-status">
            <Database size={23} aria-hidden="true" />
            <div>
              <h3>{isDemo ? "Demonstração local" : "API configurada"}</h3>
              <p>
                {isDemo
                  ? "Os dados são exemplos temporários para explorar a interface."
                  : "A aplicação consulta apenas os endpoints configurados."}
              </p>
            </div>
            <StatusBadge
              status={isDemo ? "atencao" : "normal"}
              label={isDemo ? "Demonstrativo" : "Modo API"}
            />
          </div>
          <dl className="connection-list">
            {Object.entries(endpointConfig).map(([resource, path]) => (
              <div key={resource}>
                <dt>
                  {
                    {
                      talhoes: "Talhões",
                      imagens: "Imagens",
                      alertas: "Alertas",
                      leituras: "Leituras NDVI",
                      telemetria: "Telemetria",
                    }[resource]
                  }
                </dt>
                <dd>
                  {isDemo ? (
                    "Dados demonstrativos"
                  ) : path ? (
                    <span className="positive">
                      <Check size={14} />
                      Fonte configurada
                    </span>
                  ) : (
                    "Fonte não configurada"
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="panel integration-info">
          <CircleHelp size={24} aria-hidden="true" />
          <h2>Integração de dados do Grupo 4</h2>
          <p>
            O backend consulta os cadastros no MariaDB, históricos no MongoDB,
            estado atual no Redis e imagens privadas no MinIO.
          </p>
          <p>
            Eventos MQTT do namespace do Grupo 4 são consumidos no backend e
            notificam o dashboard por SSE quando afetam alertas ou telemetria.
          </p>
          <div className="security-note">
            <ShieldCheck size={19} aria-hidden="true" />
            <span>
              O frontend não recebe credenciais. Imagens privadas são mediadas
              pela API e todas as fontes são fixadas no escopo do Grupo 4.
            </span>
          </div>
        </section>
      </div>
      <section className="panel">
        <SectionHeader title="Critérios de referência" />
        <p className="muted">
          Os rótulos de saúde usam faixas ilustrativas de NDVI. Quando a API
          fornecer uma condição do talhão, ela terá prioridade. Valide os
          critérios por cultura e estágio com o responsável agronômico.
        </p>
      </section>
    </>
  );
}
