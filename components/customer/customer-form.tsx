import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CustomerForm() {
  return (
    <Card className="p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6">
        Create Customer
      </h2>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <Label>Customer Code</Label>

          <Input placeholder="CUS-0001" />
        </div>

        <div>
          <Label>Customer Name</Label>

          <Input placeholder="ACME Corporation" />
        </div>

        <div>
          <Label>Email</Label>

          <Input placeholder="customer@email.com" />
        </div>

        <div>
          <Label>Phone</Label>

          <Input placeholder="0901234567" />
        </div>

        <div className="col-span-2">
          <Label>Address</Label>

          <Textarea placeholder="Customer address..." />
        </div>

        <div>
          <Label>Contact Person</Label>

          <Input placeholder="Nguyen Van A" />
        </div>

        <div>
          <Label>Contact Phone</Label>

          <Input placeholder="0909999999" />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline">
          Cancel
        </Button>

        <Button>
          Save Customer
        </Button>
      </div>
    </Card>
  );
}