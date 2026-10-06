// Real fma-ui components rendered under the theme being edited.

import { CircleAlert, CircleCheck, Info, MoreHorizontal, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/core/alert/alert";
import { Avatar, AvatarFallback, AvatarGroup } from "@/core/avatar/avatar";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { Calendar } from "@/core/calendar/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/card/card";
import { Checkbox } from "@/core/checkbox/checkbox";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/dialog/dialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/core/dropdown-menu/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/core/field/field";
import { Input } from "@/core/input/input";
import { Kbd } from "@/core/kbd/kbd";
import { Label } from "@/core/label/label";
import { Progress, ProgressLabel, ProgressValue } from "@/core/progress/progress";
import { RadioGroup, RadioGroupItem } from "@/core/radio-group/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { Separator } from "@/core/separator/separator";
import { Skeleton } from "@/core/skeleton/skeleton";
import { Slider } from "@/core/slider/slider";
import { Switch } from "@/core/switch/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/table/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/tabs/tabs";
import { Tooltip, TooltipTrigger } from "@/core/tooltip/tooltip";
import { SHADOW_SIZES } from "@/lib/theme/index";

const PAYMENTS = [
  { id: "INV-001", customer: "Ana Souza", amount: "R$ 250,00", status: "Paid" },
  { id: "INV-002", customer: "Bruno Lima", amount: "R$ 150,00", status: "Pending" },
  { id: "INV-003", customer: "Carla Dias", amount: "R$ 350,00", status: "Failed" },
  { id: "INV-004", customer: "Diego Alves", amount: "R$ 450,00", status: "Paid" },
] as const;

const STATUS_BADGE = {
  Paid: "success-light",
  Pending: "warning-light",
  Failed: "destructive-light",
} as const;

const CHART = [62, 88, 45, 74, 96, 58, 80];

function AccountCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your email below to create your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="showcase-email">Email</FieldLabel>
          <Input id="showcase-email" type="email" placeholder="you@example.com" />
        </Field>
        <Field>
          <FieldLabel htmlFor="showcase-password">Password</FieldLabel>
          <Input id="showcase-password" type="password" defaultValue="hunter2" />
          <FieldDescription>At least 8 characters.</FieldDescription>
        </Field>
        <div className="flex items-center gap-2">
          <Checkbox id="showcase-remember" defaultSelected />
          <Label htmlFor="showcase-remember">Remember me</Label>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">Create account</Button>
        <Button variant="outline" className="flex-1">
          Sign in
        </Button>
      </CardFooter>
    </Card>
  );
}

function SettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what we tell you about.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {["Product updates", "Security alerts", "Weekly digest"].map((label, index) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <span className="text-sm">{label}</span>
            <Switch aria-label={label} defaultSelected={index < 2} />
          </div>
        ))}
        <Separator />
        <RadioGroup aria-label="Frequency" defaultValue="daily" className="flex gap-4">
          {["instant", "daily", "weekly"].map((value) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`showcase-${value}`} />
              <Label htmlFor={`showcase-${value}`} className="capitalize">
                {value}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <div className="flex flex-col gap-2">
          <Label>Volume</Label>
          <Slider aria-label="Volume" defaultValue={60} />
        </div>
        <Select aria-label="Language" defaultSelectedKey="pt">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem id="pt">Português</SelectItem>
            <SelectItem id="en">English</SelectItem>
            <SelectItem id="es">Español</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function PaymentsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent payments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table aria-label="Recent payments">
          <TableHeader>
            <TableHead isRowHeader>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableHeader>
          <TableBody>
            {PAYMENTS.map((payment) => (
              <TableRow key={payment.id} id={payment.id}>
                <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                <TableCell>{payment.customer}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[payment.status]}>{payment.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{payment.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AlertsStack() {
  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        <Info />
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>A new version is available.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>Your changes are live.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertTitle>Storage almost full</AlertTitle>
        <AlertDescription>You've used 92% of your quota.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Check your card details and try again.</AlertDescription>
      </Alert>
    </div>
  );
}

function ControlsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buttons & badges</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="invert">Invert</Badge>
          <Badge variant="info-light">Info</Badge>
          <Badge variant="success-light">Success</Badge>
          <Badge variant="warning-light">Warning</Badge>
          <Badge variant="destructive-light">Destructive</Badge>
        </div>
        <Progress value={64}>
          <ProgressLabel>Uploading</ProgressLabel>
          <ProgressValue />
        </Progress>
        <div className="flex items-center justify-between gap-2">
          <AvatarGroup>
            {["AS", "BL", "CD"].map((initials) => (
              <Avatar key={initials}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <div className="flex gap-1.5">
            <TooltipTrigger>
              <Button variant="outline" size="sm">
                Hover me
              </Button>
              <Tooltip>Tooltips use the popover tokens</Tooltip>
            </TooltipTrigger>
            <DropdownMenuTrigger>
              <Button variant="outline" size="icon-sm" aria-label="More">
                <MoreHorizontal />
              </Button>
              <DropdownMenu className="w-48">
                <DropdownMenuLabel>Invoice</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem id="view">
                  View
                  <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem id="download">Download</DropdownMenuItem>
                <DropdownMenuItem id="delete">Delete</DropdownMenuItem>
              </DropdownMenu>
            </DropdownMenuTrigger>
            <DialogTrigger>
              <Button size="sm">Open dialog</Button>
              <Dialog>
                <DialogHeader>
                  <DialogTitle>Delete invoice?</DialogTitle>
                  <DialogDescription>This can't be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose>Cancel</DialogClose>
                  <DialogClose variant="destructive">Delete</DialogClose>
                </DialogFooter>
              </Dialog>
            </DialogTrigger>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Press <Kbd>⌘</Kbd> <Kbd>Z</Kbd> to undo an edit.
        </p>
      </CardContent>
    </Card>
  );
}

function ChartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chart colors</CardTitle>
        <CardDescription>--chart-1 … --chart-5</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-36 items-end gap-2">
          {CHART.map((value, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-md"
              style={{ height: `${value}%`, background: `var(--chart-${(index % 5) + 1})` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SurfacesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shadows & radius</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          {SHADOW_SIZES.map((size) => (
            <div
              key={size}
              className="flex h-14 items-center justify-center rounded-lg border bg-card text-xs text-muted-foreground"
              style={{ boxShadow: `var(--shadow-${size})` }}
            >
              {size}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Showcase() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      <div className="flex flex-col gap-4">
        <AccountCard />
        <PaymentsCard />
      </div>
      <div className="flex flex-col gap-4">
        <SettingsCard />
        <AlertsStack />
        <ChartCard />
      </div>
      <div className="flex flex-col gap-4">
        <Card className="items-center">
          <CardContent>
            <Calendar aria-label="Calendar" />
          </CardContent>
        </Card>
        <ControlsCard />
        <SurfacesCard />
        <Tabs defaultSelectedKey="overview">
          <TabsList>
            <TabsTrigger id="overview">Overview</TabsTrigger>
            <TabsTrigger id="analytics">Analytics</TabsTrigger>
            <TabsTrigger id="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent id="overview" className="text-muted-foreground">
            Tabs use muted for the list and background for the selected tab.
          </TabsContent>
          <TabsContent id="analytics">Analytics</TabsContent>
          <TabsContent id="reports">Reports</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
