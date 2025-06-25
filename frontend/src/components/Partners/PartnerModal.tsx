'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { partnersService, Partner, CreatePartnerData, UpdatePartnerData } from '@/services/partners.service';

const partnerSchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email deve ter um formato válido'),
  phone: z.string().optional(),
  document: z.string().optional(),
  commissionPercentage: z.number().min(0, 'Comissão deve ser no mínimo 0').max(100, 'Comissão deve ser no máximo 100'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED']).optional(),
  description: z.string().optional(),
  website: z.string().url('Website deve ser uma URL válida').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type PartnerForm = z.infer<typeof partnerSchema>;

interface PartnerModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  partner?: Partner | null;
}

export default function PartnerModal({ isOpen, onClose, partner }: PartnerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!partner;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartnerForm>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      status: 'PENDING',
      commissionPercentage: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (partner) {
        reset({
          companyName: partner.companyName,
          email: partner.email,
          phone: partner.phone || '',
          document: partner.document || '',
          commissionPercentage: partner.commissionPercentage,
          status: partner.status,
          description: partner.description || '',
          website: partner.website || '',
          address: partner.address || '',
          city: partner.city || '',
          state: partner.state || '',
          zipCode: partner.zipCode || '',
        });
      } else {
        reset({
          companyName: '',
          email: '',
          phone: '',
          document: '',
          commissionPercentage: 0,
          status: 'PENDING',
          description: '',
          website: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
        });
      }
    }
  }, [isOpen, partner, reset]);

  const onSubmit = async (data: PartnerForm) => {
    setIsLoading(true);

    try {
      // Clean empty strings
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== '')
      ) as CreatePartnerData | UpdatePartnerData;

      if (isEditing && partner) {
        await partnersService.updatePartner(partner.id, cleanData);
        toast.success('Parceiro atualizado com sucesso!');
      } else {
        await partnersService.createPartner(cleanData as CreatePartnerData);
        toast.success('Parceiro criado com sucesso!');
      }

      onClose(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao salvar parceiro';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => onClose()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          {isEditing ? 'Editar Parceiro' : 'Novo Parceiro'}
                        </Dialog.Title>
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          onClick={() => onClose()}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome da Empresa *
                            </label>
                            <input
                              {...register('companyName')}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            {errors.companyName && (
                              <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email *
                            </label>
                            <input
                              {...register('email')}
                              type="email"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            {errors.email && (
                              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Telefone
                            </label>
                            <input
                              {...register('phone')}
                              type="tel"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CPF/CNPJ
                            </label>
                            <input
                              {...register('document')}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Comissão (%) *
                            </label>
                            <input
                              {...register('commissionPercentage', { valueAsNumber: true })}
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            {errors.commissionPercentage && (
                              <p className="text-red-500 text-xs mt-1">{errors.commissionPercentage.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              {...register('status')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="PENDING">Pendente</option>
                              <option value="ACTIVE">Ativo</option>
                              <option value="INACTIVE">Inativo</option>
                              <option value="SUSPENDED">Suspenso</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Website
                            </label>
                            <input
                              {...register('website')}
                              type="url"
                              placeholder="https://exemplo.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            {errors.website && (
                              <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Endereço
                            </label>
                            <input
                              {...register('address')}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cidade
                            </label>
                            <input
                              {...register('city')}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Estado
                            </label>
                            <input
                              {...register('state')}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CEP
                            </label>
                            <input
                              {...register('zipCode')}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descrição
                            </label>
                            <textarea
                              {...register('description')}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 -mx-4 -mb-4 mt-6">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-amber-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Salvando...
                              </div>
                            ) : isEditing ? (
                              'Atualizar'
                            ) : (
                              'Criar'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onClose()}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 