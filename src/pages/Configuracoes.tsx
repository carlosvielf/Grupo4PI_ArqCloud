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
          <h2>Conectar a operação real</h2>
          <p>
            O backend não foi fornecido neste workspace. A integração precisa
            ser validada com os endpoints e formatos reais antes do uso
            operacional.
          </p>
          <p>
            O responsável técnico encontra as instruções de configuração no
            README do projeto. A mudança de ambiente exige reiniciar o frontend.
          </p>
          <div className="security-note">
            <ShieldCheck size={19} aria-hidden="true" />
            <span>
              O frontend não acessa MongoDB nem armazena credenciais de S3 ou
              MinIO. As imagens devem ser disponibilizadas pelo backend.
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
