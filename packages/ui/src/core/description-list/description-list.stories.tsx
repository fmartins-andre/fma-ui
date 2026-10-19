import type { Meta, StoryObj } from "@storybook/react-vite";
import { BuildingIcon, CalendarClockIcon, HashIcon, MapPinIcon } from "lucide-react";
import { expect } from "storybook/test";
import { Badge } from "@/core/badge/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/card/card";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "./description-list";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/DescriptionList",
  component: DescriptionList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    layout: { control: "radio", options: ["inline", "stacked"] },
    divided: { control: "boolean" },
  },
} satisfies Meta<typeof DescriptionList>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** Inline: a summary with values at the end of each row. */
export const Default: Story = {
  render: (args) => (
    <DescriptionList {...args} className="w-72">
      <DescriptionItem>
        <DescriptionTerm>Valor mensal</DescriptionTerm>
        <DescriptionDetails>R$ 189,90</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Valor anual</DescriptionTerm>
        <DescriptionDetails>R$ 2.278,80</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Validade</DescriptionTerm>
        <DescriptionDetails>
          <Badge variant="secondary">12 meses</Badge>
        </DescriptionDetails>
      </DescriptionItem>
    </DescriptionList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("term")).toHaveLength(3);
    await expect(canvas.getAllByRole("definition")[0]).toHaveTextContent("R$ 189,90");
  },
};

/** `divided` adds rules between rows, for longer summaries. */
export const Divided: Story = {
  render: () => (
    <DescriptionList divided className="w-72">
      <DescriptionItem>
        <DescriptionTerm>Subtotal</DescriptionTerm>
        <DescriptionDetails>R$ 179,00</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm>Cashback aplicado</DescriptionTerm>
        <DescriptionDetails className="text-success-foreground">− R$ 30,00</DescriptionDetails>
      </DescriptionItem>
      <DescriptionItem>
        <DescriptionTerm className="font-medium text-foreground">Total</DescriptionTerm>
        <DescriptionDetails className="text-base font-semibold">R$ 149,00</DescriptionDetails>
      </DescriptionItem>
    </DescriptionList>
  ),
};

/** Stacked, two columns, with icons: the details of a record. */
export const Stacked: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Certificado digital A1</CardTitle>
      </CardHeader>
      <CardContent>
        <DescriptionList layout="stacked" className="sm:grid-cols-2">
          <DescriptionItem>
            <DescriptionTerm>
              <CalendarClockIcon />
              Vencimento
            </DescriptionTerm>
            <DescriptionDetails>14/03/2027</DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>
              <HashIcon />
              Número de série
            </DescriptionTerm>
            <DescriptionDetails className="truncate">4F3A9C0B21E87D65</DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>
              <BuildingIcon />
              CNPJ
            </DescriptionTerm>
            <DescriptionDetails>12.345.678/0001-99</DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>
              <MapPinIcon />
              Cidade
            </DescriptionTerm>
            <DescriptionDetails>Porto Alegre – RS</DescriptionDetails>
          </DescriptionItem>
        </DescriptionList>
      </CardContent>
    </Card>
  ),
  play: async ({ canvas }) => {
    const terms = canvas.getAllByRole("term");
    const details = canvas.getAllByRole("definition");
    await expect(terms).toHaveLength(4);
    await expect(details[0]).toHaveTextContent("14/03/2027");
  },
};
