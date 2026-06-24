import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { catalogApi } from "../api";
import type { Category, Product } from "../api/types";
import { useCart } from "../context/CartContext";
import { colors, typography } from "../theme";

export function CashierScreen({ navigation }: { navigation: any }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addItem, totalItems, totalPrice } = useCart();

  async function loadData() {
    try {
      const [cats, prods] = await Promise.all([
        catalogApi.categories(),
        catalogApi.products(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err: unknown) {
      // keep previous data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // refresh on screen focus
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Category tabs */}
      <View style={styles.categoryBar}>
        <TouchableOpacity onPress={() => setSelectedCategory(null)}>
          <Text
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)}>
            <Text
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products grid */}
      <FlatList
        style={styles.productList}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => addItem(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>
              R$ {Number(item.price).toFixed(2).replace(".", ",")}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Nenhum produto</Text>
          </View>
        }
      />

      {/* Cart bar */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.navigate("Cart")}
          activeOpacity={0.8}
        >
          <View style={styles.cartLeft}>
            <Text style={styles.cartItemCount}>{totalItems} item(s)</Text>
            <Text style={styles.cartTotal}>
              R$ {totalPrice.toFixed(2).replace(".", ",")}
            </Text>
          </View>
          <Text style={styles.cartAction}>Ver carrinho →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  categoryBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: "600" as const,
    backgroundColor: colors.card,
    color: colors.muted,
    overflow: "hidden",
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  productList: { flex: 1, paddingHorizontal: 8 },
  productRow: { gap: 8, paddingHorizontal: 4 },
  productCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    minHeight: 100,
    justifyContent: "space-between",
  },
  productName: {
    ...typography.body,
    fontSize: 15,
    marginBottom: 8,
  },
  productPrice: {
    ...typography.price,
  },
  emptyWrap: { flex: 1, alignItems: "center", marginTop: 60 },
  emptyText: { color: colors.muted, fontSize: 16 },
  cartBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cartLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  cartItemCount: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  cartTotal: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700" as const,
  },
  cartAction: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
