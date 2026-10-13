import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import meta from "./meta.json";
import { Sortable, SortableItem, SortableItemHandle } from "./sortable";

interface Task {
  id: string;
  title: string;
}

const TASKS: Task[] = [
  { id: "design", title: "Design review" },
  { id: "api", title: "API contract" },
  { id: "tests", title: "Write tests" },
  { id: "ship", title: "Ship it" },
];

const COLORS = [
  { id: "red", className: "bg-red-500" },
  { id: "orange", className: "bg-orange-500" },
  { id: "amber", className: "bg-amber-500" },
  { id: "green", className: "bg-green-500" },
  { id: "teal", className: "bg-teal-500" },
  { id: "blue", className: "bg-blue-500" },
  { id: "violet", className: "bg-violet-500" },
  { id: "pink", className: "bg-pink-500" },
];

const componentMeta = {
  title: "ui/Sortable",
  component: Sortable,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  // Every story renders its own list; `children` is required by the props.
  args: { children: null },
} satisfies Meta<typeof Sortable>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const titles = (root: HTMLElement) =>
  [...root.querySelectorAll("[data-slot=sortable-item]")].map((item) => item.textContent);

function TaskList({ disabled }: { disabled?: string }) {
  const [tasks, setTasks] = React.useState(TASKS);
  return (
    <Sortable aria-label="Tasks" value={tasks} onChange={setTasks} className="w-72">
      {(task) => (
        <SortableItem
          id={task.id}
          textValue={task.title}
          isDisabled={task.id === disabled}
          className="border bg-card p-1 pe-3 text-sm"
        >
          <SortableItemHandle />
          {task.title}
        </SortableItem>
      )}
    </Sortable>
  );
}

/** A vertical list with grips: drag an item, or focus its grip and use the keyboard. */
export const Default: Story = {
  render: () => <TaskList />,
  play: async ({ canvasElement }) => {
    await expect(titles(canvasElement)).toEqual([
      "Design review",
      "API contract",
      "Write tests",
      "Ship it",
    ]);
    // Keyboard drag: reach the grip, Enter starts, arrows walk the drop positions, Enter drops.
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toHaveAccessibleName("Drag Design review");
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(document.activeElement).toHaveAccessibleName(
        /Insert between Design review and API contract/,
      ),
    );
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    await waitFor(() =>
      expect(titles(canvasElement)).toEqual([
        "API contract",
        "Write tests",
        "Design review",
        "Ship it",
      ]),
    );
  },
};

/** `isDisabled` pins an item: it can't be dragged. */
export const DisabledItem: Story = {
  render: () => <TaskList disabled="ship" />,
};

/** Static children (mapped from `value`) instead of a render function. */
export const StaticChildren: Story = {
  render: function Render() {
    const [tasks, setTasks] = React.useState(TASKS);
    return (
      <Sortable aria-label="Tasks" value={tasks} onChange={setTasks} className="w-72">
        {tasks.map((task) => (
          <SortableItem
            key={task.id}
            id={task.id}
            textValue={task.title}
            className="border bg-card p-1 pe-3 text-sm"
          >
            <SortableItemHandle />
            {task.title}
          </SortableItem>
        ))}
      </Sortable>
    );
  },
};

function ColorTile({ color, className }: { color: (typeof COLORS)[number]; className?: string }) {
  return (
    <SortableItem
      id={color.id}
      textValue={color.id}
      className={`h-24 flex-col justify-between border bg-card p-1 pb-2 text-xs ${className}`}
    >
      <SortableItemHandle className="self-start" />
      <span className={`size-6 rounded-full ${color.className}`} />
      {color.id}
    </SortableItem>
  );
}

/** `layout="horizontal"`: a single row; arrows Left/Right walk the drop positions. */
export const Horizontal: Story = {
  render: () => (
    <Sortable aria-label="Colors" defaultValue={COLORS.slice(0, 5)} layout="horizontal">
      {(color) => <ColorTile color={color} className="w-20" />}
    </Sortable>
  ),
  play: async ({ canvasElement }) => {
    // Tab reaches the handle inside the focused item.
    await userEvent.tab();
    await userEvent.tab();
    await expect(document.activeElement).toHaveAccessibleName("Drag red");
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(document.activeElement).toHaveAccessibleName(/Insert between red and orange/),
    );
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    await waitFor(() =>
      expect(titles(canvasElement)).toEqual(["orange", "amber", "red", "green", "teal"]),
    );
  },
};

/** `layout="grid"`: items wrap; give them a width. */
export const Grid: Story = {
  render: () => (
    <Sortable aria-label="Colors" defaultValue={COLORS} layout="grid" className="w-96">
      {(color) => <ColorTile color={color} className="w-[calc(25%-var(--sortable-gap)*3/4)]" />}
    </Sortable>
  ),
};

/** `selectionMode="multiple"`: selected items move together. */
export const MultipleSelection: Story = {
  render: () => (
    <Sortable
      aria-label="Tasks"
      defaultValue={TASKS}
      selectionMode="multiple"
      selectionBehavior="replace"
      className="w-72"
    >
      {(task) => (
        <SortableItem
          id={task.id}
          textValue={task.title}
          className="border bg-card p-1 pe-3 text-sm data-selected:bg-accent data-selected:text-accent-foreground"
        >
          <SortableItemHandle />
          {task.title}
        </SortableItem>
      )}
    </Sortable>
  ),
};

/** `renderDragPreview` replaces the browser's snapshot of the dragged item. */
export const CustomDragPreview: Story = {
  render: () => (
    <Sortable
      aria-label="Tasks"
      defaultValue={TASKS}
      className="w-72"
      renderDragPreview={(keys) => (
        <div className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground shadow-lg">
          Moving {TASKS.find((task) => task.id === keys[0])?.title}
          {keys.length > 1 && ` +${keys.length - 1}`}
        </div>
      )}
    >
      {(task) => (
        <SortableItem
          id={task.id}
          textValue={task.title}
          className="border bg-card p-1 pe-3 text-sm"
        >
          <SortableItemHandle />
          {task.title}
        </SortableItem>
      )}
    </Sortable>
  ),
};
