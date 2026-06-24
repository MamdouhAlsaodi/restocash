import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCart } from "../context/CartContext";
import { colors, typography } from "../theme";

export function CartScreen({ navigation }: { navigation: any }) {
  const { items, incrementItem, decrementItem, removeItem, clearCart, totalItems, totalPrice } = useCart();

  function handleClear() {
    Alert.alert("Limpar carrinho?", "Todos os itens serão removidos.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar", style: "destructive", onPress: clearCart },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carrinho ({totalItems})</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearBtn}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
              <Text style={styles.itemPrice}>
                R$ {Number(item.product.price).toFixed(2).replace(".", ",")} cada
              </Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => decrementItem(item.product.id)}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => incrementItem(item.product.id)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.itemSubtotal}>
              R$ {(Number(item.product.price) * item.quantity).toFixed(2).replace(".", ",")}
            </Text>
            <TouchableOpacity onPress={() => removeItem(item.product.id)}>
              <Text style={styles.removeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Carrinho vazio</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Cashier")}>
              <Text style={styles.emptyLink}>← Voltar para produtos</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              R$ {totalPrice.toFixed(2).replace(".", ",")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => navigation.navigate("Payment")}
          >
            <Text style={styles.checkoutBtnText}>Finalizar venda →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.title, fontSize: 20 },
  clearBtn: { color: colors.danger, fontSize: 16 },
  list: { flex: 1 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: "600" as const },
  itemPrice: { color: colors.muted, fontSize: 13, marginTop: 2 },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: { color: colors.text, fontSize: 20, fontWeight: "700" as const },
  qtyValue: { color: colors.text, fontSize: 18, fontWeight: "700" as const, minWidth: 24, textAlign: "center" },
  itemSubtotal: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "700" as const,
    minWidth: 90,
    textAlign: "right",
  },
  removeBtn: { color: colors.danger, fontSize: 16, paddingHorizontal: 4 },
  empty: { flex: 1, alignItems: "center", marginTop: 80, gap: 12 },
  emptyText: { color: colors.muted, fontSize: 18 },
  emptyLink: { color: colors.primary, fontSize: 16 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalLabel: { color: colors.muted, fontSize: 18 },
  totalValue: { color: colors.primary, fontSize: 24, fontWeight: "700" as const },
  checkoutBtn: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkoutBtnText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: "700" as const,
  },
});
