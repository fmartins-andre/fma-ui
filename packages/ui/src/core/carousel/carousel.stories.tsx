import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileBadgeIcon, FilePlusIcon, PercentIcon } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { IconTile } from "@/core/icon-tile/icon-tile";
import {
  Carousel,
  CarouselAutoplayToggle,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    className: "w-full max-w-xs",
  },
  render: (args) => (
    <Carousel {...args}>
      <CarouselContent>
        {Array.from({ length: 5 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length demo slides, index IS the identity
          <CarouselItem key={index}>
            <div className="flex aspect-square items-center justify-center rounded border bg-card p-6">
              <span className="font-semibold text-4xl">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
} satisfies Meta<typeof Carousel>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Size: Story = {
  args: { className: "mx-12 w-full max-w-xs" },
  render: (args) => (
    <Carousel {...args}>
      <CarouselContent>
        {Array.from({ length: 5 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length demo slides, index IS the identity
          <CarouselItem key={index} className="basis-1/3">
            <div className="flex aspect-square items-center justify-center rounded border bg-card p-6">
              <span className="font-semibold text-4xl">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const NavigatesWithButtons: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slides = await canvas.findAllByRole("group");
    expect(slides).toHaveLength(5);
    const nextButton = await canvas.findByRole("button", { name: /next/i });
    const prevButton = await canvas.findByRole("button", { name: /previous/i });

    for (let i = 0; i < slides.length - 1; i++) {
      await userEvent.click(nextButton);
    }
    for (let i = slides.length - 1; i > 0; i--) {
      await userEvent.click(prevButton);
    }
  },
};

/**
 * Banners that advance on their own. The toggle pauses them (required for
 * moving content); hovering or focusing the carousel pauses too, and reduced
 * motion starts it paused. Dots show and pick the current slide.
 */
export const Autoplay: Story = {
  args: {
    className: "w-full max-w-xl",
    autoplay: { delay: 2000 },
    opts: { loop: true },
    i18n: {
      labels: {
        previous: "Slide anterior",
        next: "Próximo slide",
        pause: "Pausar slides",
        start: "Reproduzir slides",
        goToSlide: (slide, total) => `Ir para o slide ${slide} de ${total}`,
      },
    },
  },
  render: (args) => (
    <Carousel {...args}>
      <CarouselContent>
        {[
          {
            icon: <FileBadgeIcon />,
            title: "Certificado A1 com 20% de desconto",
            description: "Renove o certificado dos seus clientes sem sair do painel.",
          },
          {
            icon: <FilePlusIcon />,
            title: "Notas adicionais sob demanda",
            description: "Compre pacotes avulsos quando o plano não der conta.",
          },
          {
            icon: <PercentIcon />,
            title: "Cashback em toda compra",
            description: "Use o saldo em certificados, notas ou na assinatura.",
          },
        ].map((banner) => (
          <CarouselItem key={banner.title}>
            <div className="flex items-center gap-4 rounded-xl border bg-card p-6">
              <IconTile variant="soft" size="lg">
                {banner.icon}
              </IconTile>
              <div className="flex flex-col gap-1">
                <p className="font-medium">{banner.title}</p>
                <p className="text-sm text-muted-foreground">{banner.description}</p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-3 flex items-center justify-between">
        <CarouselDots />
        <CarouselAutoplayToggle />
      </div>
    </Carousel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const carousel = canvas.getByRole("region");
    const dot = (slide: number) =>
      canvas.getByRole("button", { name: `Ir para o slide ${slide} de 3` });

    // The test runner's real cursor may sit over the carousel, which pauses
    // it; move the pointer away until it rotates.
    await waitFor(async () => {
      await userEvent.unhover(carousel);
      await expect(carousel).toHaveAttribute("data-rotating", "true");
    });
    await waitFor(() => expect(dot(1)).toHaveAttribute("aria-current", "true"));
    await waitFor(() => expect(dot(2)).toHaveAttribute("aria-current", "true"), {
      timeout: 4000,
    });

    // The toggle pauses; the slides are announced again.
    await userEvent.click(canvas.getByRole("button", { name: "Pausar slides" }));
    const toggle = canvas.getByRole("button", { name: "Reproduzir slides" });
    await waitFor(() =>
      expect(carousel.querySelector("[aria-live]")).toHaveAttribute("aria-live", "polite"),
    );

    // Resumed with focus on the toggle and the pointer away, it rotates…
    await userEvent.click(toggle);
    await waitFor(async () => {
      await userEvent.unhover(carousel);
      await expect(carousel).toHaveAttribute("data-rotating", "true");
    });

    // …and focus elsewhere inside the carousel suspends it.
    dot(3).focus();
    await waitFor(() => expect(carousel).not.toHaveAttribute("data-rotating"));
    await userEvent.click(dot(3));
    await waitFor(() => expect(dot(3)).toHaveAttribute("aria-current", "true"));
  },
};
