import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useTheme } from "styled-components";

import Intl from "intl";

import { HigtlightCard } from "../../components/HigtlightCard";
import {
  TransactionCard,
  TransactionCardProps,
} from "../../components/TransactionCard";

import {
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HigtlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer,
} from "./styles";

export interface DataListProps extends TransactionCardProps {
  id: string;
}

type HighLightProps = {
  amount: string;
  lastTransactions: string;
};

interface HightLightDataProps {
  entries: HighLightProps;
  expensives: HighLightProps;
  total: HighLightProps;
}

export function Dashboard() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [transaction, setTransaction] = useState<DataListProps[]>([]);
  const [highLightData, setHighLightData] = useState<HightLightDataProps>(
    {} as HightLightDataProps
  );

  function getLastTransactionDate(
    collection: DataListProps[],
    type: "positive" | "negative"
  ) {
    const lastTransaction = Math.max.apply(
      Math,
      collection
        .filter((transaction) => transaction.type === type)
        .map((transaction) => new Date(transaction.date).getTime())
    );

    return Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(lastTransaction));
  }

  function getTotalIntervalTransactionDate(collection: DataListProps[]) {
    const lastTransaction = new Date(
      Math.max.apply(
        Math,
        collection.map((transaction) => new Date(transaction.date).getTime())
      )
    );

    const lastTransactionFormmated = Intl.DateTimeFormat("ja-JP", {
      day: "2-digit",
      month: "2-digit",
    }).format(lastTransaction);

    const firstTransaction = new Date(
      Math.min.apply(
        Math,
        collection.map((transaction) => new Date(transaction.date).getTime())
      )
    );

    const firstTransactionFormmated = Intl.DateTimeFormat("ja-JP", {
      day: "2-digit",
      month: "2-digit",
    }).format(firstTransaction);

    const firstTransactionYear = firstTransaction.getFullYear();
    const lastTransactionYear = lastTransaction.getFullYear();

    return firstTransactionYear === lastTransactionYear
      ? `${firstTransactionFormmated} ~ ${lastTransactionFormmated}`
      : `${firstTransactionFormmated}. ${firstTransactionYear} ~ ${lastTransactionFormmated}. ${lastTransactionYear}`;
  }

  async function loadTransactions() {
    const dataKey = "@gofinances:transactions";

    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted: DataListProps[] = transactions.map(
      (item: DataListProps) => {
        if (item.type === "positive") {
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString("ja-JP", {
          style: "currency",
          currency: "JPY",
        });

        const date = Intl.DateTimeFormat("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          amount,
          date,
          type: item.type,
          category: item.category,
        };
      }
    );

    const total = entriesTotal - expensiveTotal;

    setTransaction(transactionsFormatted);

    const lastEntriesTransaction = getLastTransactionDate(
      transactions,
      "positive"
    );
    const lastExpensivesTransaction = getLastTransactionDate(
      transactions,
      "negative"
    );
    const totalInterval = getTotalIntervalTransactionDate(transactions);

    setHighLightData({
      entries: {
        amount: Number(entriesTotal).toLocaleString("ja-JP", {
          style: "currency",
          currency: "JPY",
        }),
        lastTransactions: lastEntriesTransaction,
      },
      expensives: {
        amount: Number(expensiveTotal).toLocaleString("ja-JP", {
          style: "currency",
          currency: "JPY",
        }),
        lastTransactions: lastExpensivesTransaction,
      },
      total: {
        amount: Number(total).toLocaleString("ja-JP", {
          style: "currency",
          currency: "JPY",
        }),
        lastTransactions: totalInterval,
      },
    });

    setIsLoading(false);
  }

  useEffect(() => {
    loadTransactions();
    // AsyncStorage.removeItem("@gofinances:transactions");
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  return (
    <Container>
      {isLoading ? (
        <LoadContainer>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </LoadContainer>
      ) : (
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo
                  source={{
                    uri: "https://avatars.githubusercontent.com/u/64668321?v=4",
                  }}
                />

                <User>
                  <UserGreeting>Hi,</UserGreeting>
                  <UserName>Caio</UserName>
                </User>
              </UserInfo>
              <LogoutButton onPress={() => {}}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HigtlightCards>
            <HigtlightCard
              type="up"
              title="Entradas"
              amount={highLightData.entries.amount}
              lastTransaction={`Last entries ${highLightData.entries.lastTransactions}`}
            />
            <HigtlightCard
              type="down"
              title="Saidas"
              amount={highLightData.expensives.amount}
              lastTransaction={`Last expensives ${highLightData.expensives.lastTransactions}`}
            />
            <HigtlightCard
              type="total"
              title="Total"
              amount={highLightData.total.amount}
              lastTransaction={highLightData.total.lastTransactions}
            />
          </HigtlightCards>

          <Transactions>
            <Title>Listagem</Title>

            <TransactionList
              data={transaction}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
          </Transactions>
        </>
      )}
    </Container>
  );
}
