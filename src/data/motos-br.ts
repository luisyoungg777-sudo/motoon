/**
 * Lista local de motos populares no Brasil, só para autocomplete de
 * marca/modelo no cadastro. NÃO contém intervalo de revisão por modelo —
 * ver regra da seção 6: não inventamos especificação de fabricante.
 */

export interface ModeloMoto {
  marca: string
  modelo: string
}

export const MOTOS_BR: ModeloMoto[] = [
  { marca: 'Honda', modelo: 'CG 160 Start' },
  { marca: 'Honda', modelo: 'CG 160 Fan' },
  { marca: 'Honda', modelo: 'CG 160 Titan' },
  { marca: 'Honda', modelo: 'CG 160 Cargo' },
  { marca: 'Honda', modelo: 'CG 125 Fan' },
  { marca: 'Honda', modelo: 'Biz 125' },
  { marca: 'Honda', modelo: 'Biz 110i' },
  { marca: 'Honda', modelo: 'Pop 110i' },
  { marca: 'Honda', modelo: 'Pop 100' },
  { marca: 'Honda', modelo: 'Bros 160' },
  { marca: 'Honda', modelo: 'XRE 190' },
  { marca: 'Honda', modelo: 'XRE 300' },
  { marca: 'Honda', modelo: 'Sahara 300' },
  { marca: 'Honda', modelo: 'CB 300F Twister' },
  { marca: 'Honda', modelo: 'CB 500F' },
  { marca: 'Honda', modelo: 'CB 500X' },
  { marca: 'Honda', modelo: 'PCX 160' },
  { marca: 'Honda', modelo: 'Elite 125' },
  { marca: 'Honda', modelo: 'ADV 150' },
  { marca: 'Honda', modelo: 'Hornet 500' },

  { marca: 'Yamaha', modelo: 'Factor 150' },
  { marca: 'Yamaha', modelo: 'Factor 125' },
  { marca: 'Yamaha', modelo: 'Fazer 150' },
  { marca: 'Yamaha', modelo: 'Fazer 250' },
  { marca: 'Yamaha', modelo: 'Crosser 150' },
  { marca: 'Yamaha', modelo: 'Lander 250' },
  { marca: 'Yamaha', modelo: 'XTZ 250 Ténéré' },
  { marca: 'Yamaha', modelo: 'MT-03' },
  { marca: 'Yamaha', modelo: 'MT-07' },
  { marca: 'Yamaha', modelo: 'MT-09' },
  { marca: 'Yamaha', modelo: 'R3' },
  { marca: 'Yamaha', modelo: 'NMax 160' },
  { marca: 'Yamaha', modelo: 'Neo 125' },
  { marca: 'Yamaha', modelo: 'Fluo 125' },

  { marca: 'Shineray', modelo: 'Jet 50' },
  { marca: 'Shineray', modelo: 'XY 150' },
  { marca: 'Shineray', modelo: 'Phoenix 50' },

  { marca: 'Suzuki', modelo: 'Yes 125' },
  { marca: 'Suzuki', modelo: 'Intruder 125' },
  { marca: 'Suzuki', modelo: 'GSX-S750' },
  { marca: 'Suzuki', modelo: 'V-Strom 650' },
  { marca: 'Suzuki', modelo: 'Burgman 125' },

  { marca: 'Dafra', modelo: 'Citycom 300' },
  { marca: 'Dafra', modelo: 'NH 190' },
  { marca: 'Dafra', modelo: 'Horizon 150' },

  { marca: 'Haojue', modelo: 'DK 150' },
  { marca: 'Haojue', modelo: 'DR 160' },
  { marca: 'Haojue', modelo: 'Chopper Road 150' },
  { marca: 'Haojue', modelo: 'NK 150' },

  { marca: 'Bajaj', modelo: 'Dominar 400' },
  { marca: 'Royal Enfield', modelo: 'Meteor 350' },
  { marca: 'Royal Enfield', modelo: 'Hunter 350' },
  { marca: 'Royal Enfield', modelo: 'Himalayan 411' },

  { marca: 'Kawasaki', modelo: 'Ninja 400' },
  { marca: 'Kawasaki', modelo: 'Z400' },
  { marca: 'Kawasaki', modelo: 'Versys 650' },

  { marca: 'BMW', modelo: 'G 310 R' },
  { marca: 'BMW', modelo: 'G 310 GS' },
  { marca: 'BMW', modelo: 'F 850 GS' },

  { marca: 'Triumph', modelo: 'Trident 660' },
  { marca: 'Triumph', modelo: 'Tiger 900' },

  { marca: 'Harley-Davidson', modelo: 'Iron 883' },
  { marca: 'Harley-Davidson', modelo: 'Sportster S' },
]

export const MARCAS_BR: string[] = Array.from(new Set(MOTOS_BR.map((m) => m.marca))).sort(
  (a, b) => a.localeCompare(b, 'pt-BR'),
)

export function buscarModelos(termo: string, limite = 8): ModeloMoto[] {
  const t = termo.trim().toLowerCase()
  if (!t) return []
  return MOTOS_BR.filter(
    (m) =>
      m.modelo.toLowerCase().includes(t) || `${m.marca} ${m.modelo}`.toLowerCase().includes(t),
  ).slice(0, limite)
}
