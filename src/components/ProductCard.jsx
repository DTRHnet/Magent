import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="group">
      <Card className="overflow-hidden h-full transition hover:shadow-lg hover:-translate-y-0.5">
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          {product.cover_url ? (
            <Image src={product.cover_url} alt={product.title} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground"><ShoppingBag className="h-8 w-8" /></div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="capitalize">{(product.product_type || "report").replace("_", " ")}</Badge>
            {product.sales_count > 0 && <Badge variant="outline">{product.sales_count} sold</Badge>}
          </div>
          <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary">{product.title}</h3>
          {product.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.subtitle}</p>}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold">${product.price}</span>
            <span className="text-xs text-muted-foreground">{product.niche}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}