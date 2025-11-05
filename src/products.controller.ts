import { Controller, Get, Param } from '@nestjs/common';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

@Controller('products') // otomatis jadi /api/products
export class ProductsController {
  private products: Product[] = [
    {
      id: 1,
      name: 'Kopi Arabica Gayo',
      description: 'Kopi khas Aceh dengan aroma khas dan cita rasa kuat.',
      price: 75000,
      category: 'Coffee Beans',
      stock: 120,
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
    },
    {
      id: 2,
      name: 'Kopi Robusta Lampung',
      description: 'Kopi Robusta dengan karakter pahit dan kafein tinggi.',
      price: 60000,
      category: 'Coffee Beans',
      stock: 80,
      image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800',
    },
    {
      id: 3,
      name: 'Cold Brew Botol 250ml',
      description: 'Kopi dingin siap minum hasil seduhan 12 jam.',
      price: 25000,
      category: 'Ready to Drink',
      stock: 50,
      image: 'https://images.unsplash.com/photo-1590080875839-46e17aa0b6d7?w=800',
    },
  ];

  @Get()
  findAll() {
    return {
      ok: true,
      total: this.products.length,
      data: this.products,
    };
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    const product = this.products.find((p) => p.id === Number(id));
    if (!product) {
      return { ok: false, message: `Product with id=${id} not found` };
    }
    return { ok: true, data: product };
  }
}
