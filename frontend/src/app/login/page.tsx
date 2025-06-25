'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { 
  BoltIcon, 
  CircuitBoardIcon, 
  ServerIcon, 
  CodeBracketIcon 
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

// Componente de ícone flutuante
const FloatingIcon = ({ 
  icon: Icon, 
  className, 
  delay = 0 
}: { 
  icon: any; 
  className: string; 
  delay?: number; 
}) => (
  <motion.div
    className={`absolute opacity-10 ${className}`}
    animate={{
      y: [-20, 20, -20],
      rotate: [0, 10, 0],
      opacity: [0.1, 0.2, 0.1],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <Icon className="w-12 h-12 md:w-16 md:h-16 text-primary-500" />
  </motion.div>
);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      // TODO: Implementar chamada para API de login
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular loading
      
      toast.success('Login realizado com sucesso!');
      
      // Redirecionar baseado no tipo de usuário
      // TODO: Implementar lógica de redirecionamento baseada no role
      router.push('/dashboard');
      
    } catch (error) {
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white bg-pattern flex items-center justify-center overflow-hidden relative">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* Animated Tech Background */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingIcon
          icon={CodeBracketIcon}
          className="top-[15%] left-[10%]"
          delay={0}
        />
        <FloatingIcon
          icon={CircuitBoardIcon}
          className="top-[45%] right-[15%]"
          delay={2}
        />
        <FloatingIcon
          icon={ServerIcon}
          className="bottom-[20%] left-[20%]"
          delay={4}
        />
        <FloatingIcon
          icon={BoltIcon}
          className="top-[25%] right-[25%]"
          delay={1}
        />
      </div>

      {/* Header Logo */}
      <motion.div 
        className="fixed top-4 left-4 md:top-6 md:left-6 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
            <BoltIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold text-white">Click Hype</span>
        </div>
      </motion.div>

      {/* Login Container */}
      <motion.div 
        className="w-full max-w-md px-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Login Box */}
        <div className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden">
          {/* Floating Elements */}
          <motion.div 
            className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full hidden md:block"
            animate={{ y: [-20, 20, -20] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div 
            className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary-600/10 rounded-full hidden md:block"
            animate={{ y: [20, -20, 20] }}
            transition={{ duration: 6, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Login Content */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
                Bem-vindo de volta
              </h2>
              <p className="text-gray-400 text-center mb-6 md:mb-8">
                Entre para acessar sua conta
              </p>
            </motion.div>

            <motion.form 
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">
                  E-mail
                </label>
                <input 
                  {...register('email')}
                  type="email" 
                  id="email" 
                  className={`w-full px-4 py-3 bg-gray-900/50 border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:outline-none focus:border-primary-500 text-white placeholder-gray-500 transition-colors`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="password">
                  Senha
                </label>
                <div className="relative">
                  <input 
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password" 
                    className={`w-full px-4 py-3 pr-12 bg-gray-900/50 border ${
                      errors.password ? 'border-red-500' : 'border-gray-700'
                    } rounded-lg focus:outline-none focus:border-primary-500 text-white placeholder-gray-500 transition-colors`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input 
                    {...register('remember')}
                    type="checkbox" 
                    id="remember" 
                    className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-primary-600 focus:ring-primary-500 focus:ring-2"
                  />
                  <label className="ml-2 text-gray-300" htmlFor="remember">
                    Lembrar-me
                  </label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              {/* Login Button */}
              <motion.button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none"
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </motion.button>
            </motion.form>

            {/* Divider */}
            <motion.div 
              className="mt-8 pt-6 border-t border-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="text-center text-gray-400 text-sm">
                Novo por aqui?{' '}
                <Link 
                  href="/register" 
                  className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
                >
                  Criar uma conta
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 