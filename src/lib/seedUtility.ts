
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

const categories = [
  "Rings", "Necklaces", "Earrings", "Bracelets", "Bangles", 
  "Pendants", "Anklets", "Mangalsutras", "Brooches", "Nose Rings"
];

const products = [
  {
    name: "Classic Diamond Solitaire Ring",
    description: "A stunning 1.5 carat round-cut diamond set in 18k white gold. Timeless elegance for any occasion.",
    price: 125000,
    category: "Rings",
    stock: 5,
    images: ["https://images.unsplash.com/photo-1605100804763-247f67b3f8a6?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Emerald & Gold Leaf Pendant",
    description: "Handcrafted 22k yellow gold necklace with a vibrant emerald center stone and delicate leaf motifs.",
    price: 85000,
    category: "Necklaces",
    stock: 3,
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Classic Gold Hoops",
    description: "Medium-sized 14k polished gold hoop earrings. A versatile staple for every jewelry box.",
    price: 15000,
    category: "Earrings",
    stock: 20,
    images: ["https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Sapphire Tennis Bracelet",
    description: "A continuous line of deep blue sapphires set in sterling silver. 7 inches in length.",
    price: 45000,
    category: "Bracelets",
    stock: 8,
    images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Traditional Temple Bangles",
    description: "Deeply engraved traditional gold bangles featuring intricate deity motifs. Set of 2.",
    price: 210000,
    category: "Bangles",
    stock: 2,
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Rose Gold Floral Studs",
    description: "Delicate rose gold earrings shaped like blooming jasmine flowers with small diamond centers.",
    price: 28000,
    category: "Earrings",
    stock: 12,
    images: ["https://images.unsplash.com/photo-1598560912005-79766cea136f?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Vintage Ruby Choker",
    description: "Victorian-inspired choker necklace with teardrop rubies and freshwater pearls.",
    price: 95000,
    category: "Necklaces",
    stock: 4,
    images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Platinum Band with Inset Diamonds",
    description: "A sleek 6mm platinum band with five small inset diamonds. Perfect as a wedding or anniversary ring.",
    price: 62000,
    category: "Rings",
    stock: 10,
    images: ["https://images.unsplash.com/photo-1603844018231-56207a967975?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Garnet Teardrop Anklets",
    description: "Sterling silver anklets featuring small garnet charms that catch the light beautifully.",
    price: 8500,
    category: "Anklets",
    stock: 15,
    images: ["https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Designer Bridal Mangalsutra",
    description: "Modern twist on the traditional mangalsutra with a minimalist diamond pendant and black beads.",
    price: 55000,
    category: "Mangalsutras",
    stock: 6,
    images: ["https://images.unsplash.com/photo-1599643477877-537ef5278dfb?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Amethyst Oval Earrings",
    description: "Stunning 4-carat oval-cut amethyst drop earrings set in 14k yellow gold.",
    price: 32000,
    category: "Earrings",
    stock: 9,
    images: ["https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Turquoise Boho Cuff",
    description: "Wide silver cuff bracelet with a large natural turquoise stone. Artistic and bold.",
    price: 18500,
    category: "Bracelets",
    stock: 7,
    images: ["https://images.unsplash.com/photo-1573408339311-2593f747d400?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Pearl Strand Necklace",
    description: "A 18-inch string of matched AAA quality freshwater pearls with a 14k gold clasp.",
    price: 42000,
    category: "Necklaces",
    stock: 11,
    images: ["https://images.unsplash.com/photo-1506630448388-4ca24cc652a6?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Opal Heart Pendant",
    description: "A fiery Australian opal heart set in a gold frame. Changes color in different lights.",
    price: 24000,
    category: "Pendants",
    stock: 14,
    images: ["https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Filigree Gold Bangles",
    description: "Extremely delicate gold filigree work on a pair of lightweight daily wear bangles.",
    price: 135000,
    category: "Bangles",
    stock: 5,
    images: ["https://images.unsplash.com/photo-1629224316810-9d8805b95e76?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Designer Nose Pin",
    description: "Small 18k gold nose pin with a single sparkler diamond. Very secure screw-back design.",
    price: 4500,
    category: "Nose Rings",
    stock: 25,
    images: ["https://images.unsplash.com/photo-1589128777073-263566ae5e4d?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Peacock Motif Brooch",
    description: "A colorful brooch accented with blue and green enameling and small set stones.",
    price: 12000,
    category: "Brooches",
    stock: 3,
    images: ["https://images.unsplash.com/photo-1561932850-f13404855e53?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Modern Art Deco Ring",
    description: "Geometric lines meet fine jewelry in this Art Deco-inspired sapphire and diamond ring.",
    price: 78000,
    category: "Rings",
    stock: 4,
    images: ["https://images.unsplash.com/photo-1586822330090-093f4864551d?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Topaz Crystal Necklace",
    description: "Long multi-strand necklace with honey topaz crystals and gold-plated spacers.",
    price: 19000,
    category: "Necklaces",
    stock: 8,
    images: ["https://images.unsplash.com/photo-1626497748470-3623f81e642c?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Kundan Statement Earrings",
    description: "Grand Kundan earrings with green meenakari work and pearl drops. Perfect for weddings.",
    price: 48000,
    category: "Earrings",
    stock: 5,
    images: ["https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=800"]
  },
  {
    name: "Braided Silver Bracelet",
    description: "Hand-braided high-purity silver bracelet with an oxidized finish for a rustic look.",
    price: 9500,
    category: "Bracelets",
    stock: 18,
    images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800"]
  }
];

export async function seedProducts() {
  const loadingToast = toast.loading('Seeding products...');
  try {
    // Seed Settings
    await setDoc(doc(db, 'settings', 'store'), {
      categories,
      upiId: 'itssanjaydutta@okaxis',
      minOrderAmount: 1000
    });

    // Seed Products
    for (const product of products) {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    toast.success('Successfully added 20+ products!', { id: loadingToast });
  } catch (err: any) {
    console.error(err);
    toast.error('Seeding failed: ' + err.message, { id: loadingToast });
  }
}
