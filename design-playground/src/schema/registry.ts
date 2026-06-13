import type { WidgetType } from '@/model/types';
import type { PropDescriptor, SchemaTable } from './descriptor';
import { textSchema } from './widgets/text';
import { containerSchema } from './widgets/container';
import { flexSchema } from './widgets/flex';
import { iconSchema } from './widgets/icon';
import { buttonSchema } from './widgets/button';
import { imageSchema } from './widgets/image';
import { inputSchema } from './widgets/input';
import { stackSchema } from './widgets/stack';
import { listViewSchema } from './widgets/listview';
import { gridViewSchema } from './widgets/gridview';

const TABLE: SchemaTable = {
  Text: textSchema,
  Container: containerSchema,
  Row: flexSchema,
  Column: flexSchema,
  Icon: iconSchema,
  Button: buttonSchema,
  Image: imageSchema,
  Input: inputSchema,
  Stack: stackSchema,
  ListView: listViewSchema,
  GridView: gridViewSchema,
};

export function getDescriptors(type: WidgetType): PropDescriptor[] {
  return TABLE[type] ?? [];
}

export function getDescriptor(type: WidgetType, key: string): PropDescriptor | undefined {
  return getDescriptors(type).find((d) => d.key === key);
}
