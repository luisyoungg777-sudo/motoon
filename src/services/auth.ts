import { obterSupabase, supabaseConfigurado } from './supabase'

export interface Conta {
  id: string
  email: string
  nome: string | null
  criadaEm: string | null
}

export type Resultado = { ok: true; recado?: string } | { ok: false; erro: string }

/**
 * O Supabase devolve mensagem em inglês e com jargão. Aqui vira português de
 * gente. Qualquer coisa que eu não reconheça cai numa frase honesta em vez de
 * vazar o texto cru para quem está na rua.
 */
function traduzir(bruto: string): string {
  const m = bruto.toLowerCase()

  if (m.includes('invalid login credentials')) return 'E-mail ou senha não conferem.'
  if (m.includes('email not confirmed')) return 'Confirme o e-mail que te enviamos antes de entrar.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Esse e-mail já tem conta. Tente entrar.'
  if (m.includes('password should be at least'))
    return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'Esse e-mail não parece válido.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas seguidas. Espera um minuto e tenta de novo.'
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'Sem internet agora. O app continua funcionando normalmente.'

  return 'Não deu para completar agora. Tenta de novo em instantes.'
}

const SEM_CONFIG: Resultado = {
  ok: false,
  erro: 'Backup na nuvem ainda não está ligado neste aparelho.',
}

function paraConta(usuario: {
  id: string
  email?: string
  created_at?: string
  user_metadata?: { nome?: string }
}): Conta {
  return {
    id: usuario.id,
    email: usuario.email ?? '',
    nome: usuario.user_metadata?.nome ?? null,
    criadaEm: usuario.created_at ?? null,
  }
}

export async function criarConta(email: string, senha: string, nome: string): Promise<Resultado> {
  const sb = await obterSupabase()
  if (!sb) return SEM_CONFIG

  const { error } = await sb.auth.signUp({
    email: email.trim(),
    password: senha,
    options: { data: { nome: nome.trim() } },
  })
  if (error) return { ok: false, erro: traduzir(error.message) }

  return {
    ok: true,
    recado: 'Conta criada. Se pedirmos confirmação, o e-mail já está a caminho.',
  }
}

export async function entrar(email: string, senha: string): Promise<Resultado> {
  const sb = await obterSupabase()
  if (!sb) return SEM_CONFIG

  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha })
  if (error) return { ok: false, erro: traduzir(error.message) }
  return { ok: true }
}

export async function sair(): Promise<Resultado> {
  const sb = await obterSupabase()
  if (!sb) return SEM_CONFIG

  const { error } = await sb.auth.signOut()
  if (error) return { ok: false, erro: traduzir(error.message) }
  return { ok: true }
}

export async function recuperarSenha(email: string): Promise<Resultado> {
  const sb = await obterSupabase()
  if (!sb) return SEM_CONFIG

  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${window.location.pathname}#/conta`,
  })
  if (error) return { ok: false, erro: traduzir(error.message) }

  return {
    ok: true,
    recado: 'Se existir conta com esse e-mail, o link de troca de senha já foi enviado.',
  }
}

export async function definirNovaSenha(senha: string): Promise<Resultado> {
  const sb = await obterSupabase()
  if (!sb) return SEM_CONFIG

  const { error } = await sb.auth.updateUser({ password: senha })
  if (error) return { ok: false, erro: traduzir(error.message) }
  return { ok: true, recado: 'Senha trocada.' }
}

export async function sessaoAtual(): Promise<Conta | null> {
  if (!supabaseConfigurado()) return null
  const sb = await obterSupabase()
  if (!sb) return null

  const { data } = await sb.auth.getSession()
  return data.session?.user ? paraConta(data.session.user) : null
}

/** Observa login e logout. Devolve a função que cancela a inscrição. */
export async function aoMudarSessao(cb: (conta: Conta | null) => void): Promise<() => void> {
  const sb = await obterSupabase()
  if (!sb) return () => {}

  const { data } = sb.auth.onAuthStateChange((_evento, sessao) => {
    cb(sessao?.user ? paraConta(sessao.user) : null)
  })

  return () => data.subscription.unsubscribe()
}
