import type { Meta, StoryObj } from "@storybook/react-vite";
import { PencilIcon, UserPlusIcon, XIcon } from "lucide-react";
import * as React from "react";
import { type Key, Text } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/core/card/card";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "@/core/description-list/description-list";
import { Label } from "@/core/label/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "./combobox";
import meta from "./meta.json";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

const componentMeta = {
  title: "ui/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  render: (args) => (
    <Combobox {...args}>
      <ComboboxInput placeholder="Select a framework" />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList items={frameworks.map((item) => ({ id: item, name: item }))}>
          {(item) => <ComboboxItem id={item.id}>{item.name}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
} satisfies Meta<typeof Combobox>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const FiltersAndSelects: Story = {
  play: async ({ canvasElement }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);
    const input = await canvasBody.findByRole("combobox");

    await userEvent.type(input, "nex", { delay: 50 });
    const options = await canvasBody.findAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(/next\.js/i);

    await userEvent.click(await canvasBody.findByRole("option", { name: /next\.js/i }));
    expect(input).toHaveValue("Next.js");

    // Storybook's addon-vitest runs multiple story files in the same
    // browser context — leaving this input focused with a value bled into
    // an unrelated later test (command.stories.tsx's Autocomplete).
    input.blur();
  },
};

type Customer = { id: string; name: string; document: string; city: string; state: string };

const CUSTOMERS: Customer[] = [
  { id: "1", name: "Mercado Silva", document: "12.345.678/0001-90", city: "Campinas", state: "SP" },
  {
    id: "2",
    name: "Padaria Pão Quente",
    document: "23.456.789/0001-01",
    city: "Santos",
    state: "SP",
  },
  { id: "3", name: "Ana Souza", document: "123.456.789-09", city: "Curitiba", state: "PR" },
  {
    id: "4",
    name: "Auto Peças Rocha",
    document: "34.567.890/0001-12",
    city: "Londrina",
    state: "PR",
  },
  { id: "5", name: "Silva & Filhos", document: "45.678.901/0001-23", city: "Recife", state: "PE" },
];

const RECENT_IDS = ["1", "3"];

const createCustomer = fn((_query: string) => {});
const editCustomer = fn((_customer: Customer) => {});

function matches(customer: Customer, query: string) {
  const text = query.trim().toLocaleLowerCase("pt-BR");
  const digits = text.replace(/\D/g, "");
  return (
    customer.name.toLocaleLowerCase("pt-BR").includes(text) ||
    (digits !== "" && customer.document.replace(/\D/g, "").includes(digits))
  );
}

function CustomerOption({ customer }: { customer: Customer }) {
  return (
    <ComboboxItem id={customer.id} textValue={customer.name}>
      <div className="flex min-w-0 flex-col">
        <Text slot="label" className="truncate">
          {customer.name}
        </Text>
        <Text slot="description" className="truncate text-xs text-muted-foreground">
          {customer.document} · {customer.city}/{customer.state}
        </Text>
      </div>
    </ComboboxItem>
  );
}

function CustomerPicker() {
  const [query, setQuery] = React.useState("");
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const recent = CUSTOMERS.filter((item) => RECENT_IDS.includes(item.id));
  const found = query.trim() === "" ? [] : CUSTOMERS.filter((item) => matches(item, query));

  function handleSelect(key: Key | null) {
    if (key === "create") {
      createCustomer(query);
      return;
    }
    const chosen = CUSTOMERS.find((item) => item.id === key);
    if (chosen) setCustomer(chosen);
  }

  if (customer) {
    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
          <CardAction className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${customer.name}`}
              onPress={() => editCustomer(customer)}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remover ${customer.name}`}
              onPress={() => {
                setCustomer(null);
                setQuery("");
                // Back to the search, where the choice is made again.
                window.requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              <XIcon />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DescriptionList>
            <DescriptionItem>
              <DescriptionTerm>CPF/CNPJ</DescriptionTerm>
              <DescriptionDetails>{customer.document}</DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>Cidade</DescriptionTerm>
              <DescriptionDetails>
                {customer.city}/{customer.state}
              </DescriptionDetails>
            </DescriptionItem>
          </DescriptionList>
        </CardContent>
      </Card>
    );
  }

  return (
    <Combobox
      className="flex w-96 flex-col gap-2"
      inputValue={query}
      onInputChange={setQuery}
      selectedKey={null}
      onSelectionChange={handleSelect}
      // The list below is filtered here: recents first, "create" always last.
      defaultFilter={() => true}
      menuTrigger="focus"
    >
      <Label>Cliente</Label>
      <ComboboxInput ref={inputRef} placeholder="Busque pelo nome, CPF ou CNPJ" />
      <ComboboxContent>
        <ComboboxList>
          {query.trim() === "" ? (
            <ComboboxGroup>
              <ComboboxLabel>Recentes</ComboboxLabel>
              {recent.map((item) => (
                <CustomerOption key={item.id} customer={item} />
              ))}
            </ComboboxGroup>
          ) : (
            found.map((item) => <CustomerOption key={item.id} customer={item} />)
          )}
          <ComboboxSeparator />
          <ComboboxItem id="create" textValue="Cadastrar novo cliente">
            <UserPlusIcon />
            <div className="flex min-w-0 flex-col">
              <Text slot="label">Cadastrar novo cliente</Text>
              {/* Always rendered: the option is described from its first render. */}
              <Text slot="description" className="text-xs text-muted-foreground">
                {query.trim() !== "" && found.length === 0
                  ? `Nenhum cliente com “${query.trim()}”. Confira o CPF ou o CNPJ, ou cadastre.`
                  : "Para quem ainda não está na lista."}
              </Text>
            </div>
          </ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * Choosing an entity (customer, carrier, driver, vehicle): recent ones first,
 * two-line options (name, then document · city/state), "Cadastrar novo" at
 * the end of the list, explaining what to try when nothing matches. Once
 * chosen, a card shows the details with Edit and Remove. Search and the
 * create form stay in the app.
 */
export const EntityPicker: Story = {
  render: () => <CustomerPicker />,
  play: async ({ canvas }) => {
    const body = within(document.body);
    const input = canvas.getByRole("combobox", { name: "Cliente" });

    await userEvent.click(input);
    const recent = await body.findByRole("group", { name: "Recentes" });
    await expect(within(recent).getAllByRole("option")).toHaveLength(2);
    await waitFor(() =>
      expect(body.getByRole("option", { name: "Cadastrar novo cliente" })).toBeVisible(),
    );

    // Two lines: the document and city describe the option.
    await userEvent.type(input, "silva");
    const option = await body.findByRole("option", { name: "Mercado Silva" });
    await expect(option).toHaveAccessibleDescription("12.345.678/0001-90 · Campinas/SP");
    await expect(body.getAllByRole("option")).toHaveLength(3);

    // Nothing found: the create option says what to try.
    await userEvent.clear(input);
    await userEvent.type(input, "99.999");
    const create = await body.findByRole("option", { name: "Cadastrar novo cliente" });
    await waitFor(() => expect(create).toHaveAccessibleDescription(/Nenhum cliente com “99.999”/));
    await userEvent.click(create);
    await expect(createCustomer).toHaveBeenCalledWith("99.999");

    await userEvent.clear(input);
    await userEvent.type(input, "ana");
    await userEvent.click(await body.findByRole("option", { name: "Ana Souza" }));
    await expect(canvas.getByText("123.456.789-09")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Editar Ana Souza" }));
    await expect(editCustomer).toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: "Remover Ana Souza" }));
    await waitFor(() => expect(canvas.getByRole("combobox", { name: "Cliente" })).toHaveFocus());
    canvas.getByRole("combobox", { name: "Cliente" }).blur();
  },
};
