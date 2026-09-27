import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  Carousel,
  CarouselContent,
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
